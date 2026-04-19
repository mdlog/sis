/// Sovereign Intent Solver - Intent Registry
/// Canonical on-chain lifecycle for a single intent:
///   Pending -> Claimed -> Settled
///                     v Refunded (deadline elapsed, solver failed)
module sis::intent_registry {
    use std::error;
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use initia_std::event;
    use initia_std::table::{Self, Table};
    use initia_std::timestamp;

    // ---- Errors ------------------------------------------------------------

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INTENT_NOT_FOUND: u64 = 3;
    const E_INTENT_NOT_PENDING: u64 = 4;
    const E_INTENT_NOT_CLAIMED: u64 = 5;
    const E_NOT_SOLVER: u64 = 6;
    const E_NOT_EXPIRED: u64 = 7;
    const E_DEADLINE_PASSED: u64 = 8;
    const E_INVALID_ARGS: u64 = 9;

    // ---- Status codes ------------------------------------------------------

    const STATUS_PENDING: u8 = 0;
    const STATUS_CLAIMED: u8 = 1;
    const STATUS_SETTLED: u8 = 2;
    const STATUS_REFUNDED: u8 = 3;

    // ---- Resource types ----------------------------------------------------

    struct Intent has store, drop, copy {
        id: u64,
        owner: address,
        source_minitia: String,
        target_minitia: String,
        desired_asset: String,
        min_receive: u64,
        slippage_bps: u64,
        reward_uinit: u64,
        deadline: u64,
        status: u8,
        solver: Option<address>,
        proof_hash: vector<u8>,
        created_at: u64,
        claimed_at: u64,
        settled_at: u64,
    }

    struct SolverStat has store, drop, copy {
        solver: address,
        intents_claimed: u64,
        intents_settled: u64,
        intents_refunded: u64,
        total_earned_uinit: u64,
        last_active_at: u64,
    }

    struct Registry has key {
        next_id: u64,
        intents: Table<u64, Intent>,
        /// ring buffer of recent intent ids, newest first - cap at 128
        recent: vector<u64>,
        /// pending intent ids, newest last - pruned on claim/refund
        pending: vector<u64>,
        solver_stats: Table<address, SolverStat>,
        /// ordered list of solver addresses for leaderboard enumeration
        solvers: vector<address>,
        total_intents: u64,
        total_settled: u64,
        total_refunded: u64,
        total_reward_paid_uinit: u64,
    }

    // ---- Events ------------------------------------------------------------

    #[event]
    struct IntentCreatedEvent has drop, store {
        id: u64,
        owner: address,
        source_minitia: String,
        target_minitia: String,
        reward_uinit: u64,
        deadline: u64,
        created_at: u64,
    }

    #[event]
    struct IntentClaimedEvent has drop, store {
        id: u64,
        solver: address,
        claimed_at: u64,
    }

    #[event]
    struct IntentSettledEvent has drop, store {
        id: u64,
        solver: address,
        proof_hash: vector<u8>,
        reward_uinit: u64,
        settled_at: u64,
    }

    #[event]
    struct IntentRefundedEvent has drop, store {
        id: u64,
        owner: address,
        refunded_at: u64,
    }

    // ---- View structs (return by value to frontend) ------------------------

    struct IntentView has copy, drop, store {
        id: u64,
        owner: address,
        source_minitia: String,
        target_minitia: String,
        desired_asset: String,
        min_receive: u64,
        slippage_bps: u64,
        reward_uinit: u64,
        deadline: u64,
        status: u8,
        solver: Option<address>,
        proof_hash: vector<u8>,
        created_at: u64,
        claimed_at: u64,
        settled_at: u64,
    }

    struct SolverStatView has copy, drop, store {
        solver: address,
        intents_claimed: u64,
        intents_settled: u64,
        intents_refunded: u64,
        total_earned_uinit: u64,
        last_active_at: u64,
    }

    struct RegistryStats has copy, drop, store {
        total_intents: u64,
        total_settled: u64,
        total_refunded: u64,
        total_reward_paid_uinit: u64,
        pending_count: u64,
    }

    // ---- Init --------------------------------------------------------------

    fun init_module(publisher: &signer) {
        assert!(
            !exists<Registry>(signer::address_of(publisher)),
            error::already_exists(E_ALREADY_INITIALIZED)
        );
        move_to(
            publisher,
            Registry {
                next_id: 0,
                intents: table::new<u64, Intent>(),
                recent: vector::empty<u64>(),
                pending: vector::empty<u64>(),
                solver_stats: table::new<address, SolverStat>(),
                solvers: vector::empty<address>(),
                total_intents: 0,
                total_settled: 0,
                total_refunded: 0,
                total_reward_paid_uinit: 0,
            }
        );
    }

    // ---- Entry functions ---------------------------------------------------

    public entry fun create_intent(
        account: &signer,
        source_minitia: String,
        target_minitia: String,
        desired_asset: String,
        min_receive: u64,
        slippage_bps: u64,
        reward_uinit: u64,
        deadline_seconds: u64,
    ) acquires Registry {
        assert!(
            slippage_bps <= 10_000,
            error::invalid_argument(E_INVALID_ARGS)
        );
        assert!(
            deadline_seconds >= 30 && deadline_seconds <= 3_600,
            error::invalid_argument(E_INVALID_ARGS)
        );

        let registry = borrow_global_mut<Registry>(@sis);
        let now = timestamp::now_seconds();
        let id = registry.next_id;
        registry.next_id = id + 1;
        registry.total_intents = registry.total_intents + 1;

        let owner = signer::address_of(account);
        let deadline = now + deadline_seconds;

        let intent = Intent {
            id,
            owner,
            source_minitia,
            target_minitia,
            desired_asset,
            min_receive,
            slippage_bps,
            reward_uinit,
            deadline,
            status: STATUS_PENDING,
            solver: option::none<address>(),
            proof_hash: vector::empty<u8>(),
            created_at: now,
            claimed_at: 0,
            settled_at: 0,
        };

        table::add(&mut registry.intents, id, intent);
        push_ring(&mut registry.recent, id, 128);
        vector::push_back(&mut registry.pending, id);

        event::emit(IntentCreatedEvent {
            id,
            owner,
            source_minitia: intent.source_minitia,
            target_minitia: intent.target_minitia,
            reward_uinit,
            deadline,
            created_at: now,
        });
    }

    public entry fun claim_intent(solver: &signer, intent_id: u64) acquires Registry {
        let registry = borrow_global_mut<Registry>(@sis);
        assert!(
            table::contains(&registry.intents, intent_id),
            error::not_found(E_INTENT_NOT_FOUND)
        );

        let intent = table::borrow_mut(&mut registry.intents, intent_id);
        assert!(intent.status == STATUS_PENDING, error::invalid_state(E_INTENT_NOT_PENDING));

        let now = timestamp::now_seconds();
        assert!(now <= intent.deadline, error::invalid_state(E_DEADLINE_PASSED));

        let solver_addr = signer::address_of(solver);
        intent.status = STATUS_CLAIMED;
        intent.solver = option::some(solver_addr);
        intent.claimed_at = now;

        remove_from_pending(&mut registry.pending, intent_id);
        touch_solver(registry, solver_addr, now);
        let stat = table::borrow_mut(&mut registry.solver_stats, solver_addr);
        stat.intents_claimed = stat.intents_claimed + 1;

        event::emit(IntentClaimedEvent {
            id: intent_id,
            solver: solver_addr,
            claimed_at: now,
        });
    }

    public entry fun settle_intent(
        solver: &signer,
        intent_id: u64,
        proof_hash: vector<u8>,
    ) acquires Registry {
        let registry = borrow_global_mut<Registry>(@sis);
        assert!(
            table::contains(&registry.intents, intent_id),
            error::not_found(E_INTENT_NOT_FOUND)
        );

        let intent = table::borrow_mut(&mut registry.intents, intent_id);
        assert!(intent.status == STATUS_CLAIMED, error::invalid_state(E_INTENT_NOT_CLAIMED));

        let solver_addr = signer::address_of(solver);
        let claimer = *option::borrow(&intent.solver);
        assert!(solver_addr == claimer, error::permission_denied(E_NOT_SOLVER));

        let now = timestamp::now_seconds();
        intent.status = STATUS_SETTLED;
        intent.proof_hash = proof_hash;
        intent.settled_at = now;

        let stat = table::borrow_mut(&mut registry.solver_stats, solver_addr);
        stat.intents_settled = stat.intents_settled + 1;
        stat.total_earned_uinit = stat.total_earned_uinit + intent.reward_uinit;
        stat.last_active_at = now;

        registry.total_settled = registry.total_settled + 1;
        registry.total_reward_paid_uinit =
            registry.total_reward_paid_uinit + intent.reward_uinit;

        event::emit(IntentSettledEvent {
            id: intent_id,
            solver: solver_addr,
            proof_hash: intent.proof_hash,
            reward_uinit: intent.reward_uinit,
            settled_at: now,
        });
    }

    /// Anyone may trigger a refund once the deadline has passed. If the intent
    /// was claimed but not settled the solver is penalized in their stats.
    public entry fun refund_if_expired(_caller: &signer, intent_id: u64)
    acquires Registry {
        let registry = borrow_global_mut<Registry>(@sis);
        assert!(
            table::contains(&registry.intents, intent_id),
            error::not_found(E_INTENT_NOT_FOUND)
        );

        let intent = table::borrow_mut(&mut registry.intents, intent_id);
        assert!(
            intent.status == STATUS_PENDING || intent.status == STATUS_CLAIMED,
            error::invalid_state(E_INTENT_NOT_PENDING)
        );

        let now = timestamp::now_seconds();
        assert!(now > intent.deadline, error::invalid_state(E_NOT_EXPIRED));

        if (intent.status == STATUS_PENDING) {
            remove_from_pending(&mut registry.pending, intent_id);
        } else {
            let solver_addr = *option::borrow(&intent.solver);
            let stat = table::borrow_mut(&mut registry.solver_stats, solver_addr);
            stat.intents_refunded = stat.intents_refunded + 1;
        };

        intent.status = STATUS_REFUNDED;
        intent.settled_at = now;
        registry.total_refunded = registry.total_refunded + 1;

        event::emit(IntentRefundedEvent {
            id: intent_id,
            owner: intent.owner,
            refunded_at: now,
        });
    }

    // ---- View functions ----------------------------------------------------

    #[view]
    public fun get_intent(id: u64): IntentView acquires Registry {
        let registry = borrow_global<Registry>(@sis);
        assert!(
            table::contains(&registry.intents, id),
            error::not_found(E_INTENT_NOT_FOUND)
        );
        let i = table::borrow(&registry.intents, id);
        intent_to_view(i)
    }

    #[view]
    public fun list_pending(limit: u64): vector<IntentView> acquires Registry {
        let registry = borrow_global<Registry>(@sis);
        collect_by_ids(registry, &registry.pending, limit, /*reverse=*/ true)
    }

    #[view]
    public fun list_recent(limit: u64): vector<IntentView> acquires Registry {
        let registry = borrow_global<Registry>(@sis);
        collect_by_ids(registry, &registry.recent, limit, /*reverse=*/ false)
    }

    #[view]
    public fun stats(): RegistryStats acquires Registry {
        let registry = borrow_global<Registry>(@sis);
        RegistryStats {
            total_intents: registry.total_intents,
            total_settled: registry.total_settled,
            total_refunded: registry.total_refunded,
            total_reward_paid_uinit: registry.total_reward_paid_uinit,
            pending_count: vector::length(&registry.pending),
        }
    }

    #[view]
    public fun leaderboard(limit: u64): vector<SolverStatView> acquires Registry {
        let registry = borrow_global<Registry>(@sis);
        let out = vector::empty<SolverStatView>();
        let n = vector::length(&registry.solvers);
        let cap = if (limit == 0 || limit > n) n else limit;
        let i = 0;
        while (i < cap) {
            let addr = *vector::borrow(&registry.solvers, i);
            let s = table::borrow(&registry.solver_stats, addr);
            vector::push_back(
                &mut out,
                SolverStatView {
                    solver: s.solver,
                    intents_claimed: s.intents_claimed,
                    intents_settled: s.intents_settled,
                    intents_refunded: s.intents_refunded,
                    total_earned_uinit: s.total_earned_uinit,
                    last_active_at: s.last_active_at,
                }
            );
            i = i + 1;
        };
        out
    }

    // ---- Internal helpers --------------------------------------------------

    fun intent_to_view(i: &Intent): IntentView {
        IntentView {
            id: i.id,
            owner: i.owner,
            source_minitia: i.source_minitia,
            target_minitia: i.target_minitia,
            desired_asset: i.desired_asset,
            min_receive: i.min_receive,
            slippage_bps: i.slippage_bps,
            reward_uinit: i.reward_uinit,
            deadline: i.deadline,
            status: i.status,
            solver: i.solver,
            proof_hash: i.proof_hash,
            created_at: i.created_at,
            claimed_at: i.claimed_at,
            settled_at: i.settled_at,
        }
    }

    fun collect_by_ids(
        registry: &Registry,
        ids: &vector<u64>,
        limit: u64,
        reverse: bool,
    ): vector<IntentView> {
        let out = vector::empty<IntentView>();
        let n = vector::length(ids);
        let cap = if (limit == 0 || limit > n) n else limit;
        let k = 0;
        while (k < cap) {
            let idx = if (reverse) n - 1 - k else k;
            let id = *vector::borrow(ids, idx);
            if (table::contains(&registry.intents, id)) {
                let i = table::borrow(&registry.intents, id);
                vector::push_back(&mut out, intent_to_view(i));
            };
            k = k + 1;
        };
        out
    }

    fun push_ring(buf: &mut vector<u64>, id: u64, cap: u64) {
        vector::push_back(buf, id);
        while (vector::length(buf) > cap) {
            vector::remove(buf, 0);
        };
    }

    fun remove_from_pending(pending: &mut vector<u64>, id: u64) {
        let (found, idx) = vector::index_of(pending, &id);
        if (found) {
            vector::remove(pending, idx);
        };
    }

    fun touch_solver(registry: &mut Registry, addr: address, now: u64) {
        if (!table::contains(&registry.solver_stats, addr)) {
            table::add(
                &mut registry.solver_stats,
                addr,
                SolverStat {
                    solver: addr,
                    intents_claimed: 0,
                    intents_settled: 0,
                    intents_refunded: 0,
                    total_earned_uinit: 0,
                    last_active_at: now,
                }
            );
            vector::push_back(&mut registry.solvers, addr);
        };
    }

    // ---- Tests -------------------------------------------------------------

    #[test_only]
    use initia_std::account;
    #[test_only]
    use initia_std::block;

    #[test_only]
    fun setup_for_test(publisher: &signer) {
        block::set_block_info(1, 1_700_000_000);
        account::create_account_for_test(signer::address_of(publisher));
        init_module(publisher);
    }

    #[test(publisher = @sis, user = @0xaa, solver = @0xbb)]
    fun test_happy_path(publisher: &signer, user: &signer, solver: &signer)
    acquires Registry {
        setup_for_test(publisher);
        account::create_account_for_test(signer::address_of(user));
        account::create_account_for_test(signer::address_of(solver));

        create_intent(
            user,
            string::utf8(b"milkyway"),
            string::utf8(b"nftflow"),
            string::utf8(b"genesis_sword"),
            1,
            50,
            250_000,
            120,
        );

        let pending = list_pending(10);
        assert!(vector::length(&pending) == 1, 100);

        claim_intent(solver, 0);
        let claimed = get_intent(0);
        assert!(claimed.status == STATUS_CLAIMED, 101);

        settle_intent(solver, 0, b"0xdeadbeef");
        let settled = get_intent(0);
        assert!(settled.status == STATUS_SETTLED, 102);

        let s = stats();
        assert!(s.total_settled == 1, 103);
        assert!(s.total_reward_paid_uinit == 250_000, 104);

        let lb = leaderboard(10);
        assert!(vector::length(&lb) == 1, 105);
        let top = vector::borrow(&lb, 0);
        assert!(top.intents_settled == 1, 106);
    }

    #[test(publisher = @sis, user = @0xaa)]
    #[expected_failure(abort_code = 0x30005, location = Self)]
    fun test_cannot_settle_unclaimed(publisher: &signer, user: &signer)
    acquires Registry {
        setup_for_test(publisher);
        account::create_account_for_test(signer::address_of(user));
        create_intent(
            user,
            string::utf8(b"a"),
            string::utf8(b"b"),
            string::utf8(b"x"),
            1,
            50,
            1,
            60,
        );
        settle_intent(user, 0, b"");
    }

    #[test(publisher = @sis, user = @0xaa)]
    fun test_refund_after_deadline(publisher: &signer, user: &signer)
    acquires Registry {
        setup_for_test(publisher);
        account::create_account_for_test(signer::address_of(user));
        create_intent(
            user,
            string::utf8(b"a"),
            string::utf8(b"b"),
            string::utf8(b"x"),
            1,
            50,
            1,
            60,
        );
        // advance past deadline
        block::set_block_info(2, 1_700_000_000 + 61);
        refund_if_expired(user, 0);
        let v = get_intent(0);
        assert!(v.status == STATUS_REFUNDED, 200);
    }
}
