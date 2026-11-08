/// Retrace device passport (v2).
///
/// A passport is a Sui object that stands for one physical device inside the
/// Retrace app. Its object ID never changes, so the repair memory the app keeps
/// for it (in Walrus Memory, namespaced by this ID) survives every change of
/// owner. The passport is an app record: it does not by itself prove who
/// physically holds the device.
///
/// v2 hardening:
/// - A shared `Registry` maps each serial hash to exactly one passport, so a
///   device cannot be re-registered with a clean history ("history laundering").
/// - `DevicePassport` has no `store` ability: it can only move through
///   `transfer_passport`, so every ownership change emits a Retrace event and
///   the onchain ownership history has no gaps.
module retrace::passport;

use std::string::String;
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};

const EAlreadyRegistered: u64 = 1;
const EInvalidSerialHash: u64 = 2;
const EFieldTooLong: u64 = 3;
const ESameOwner: u64 = 4;

const SERIAL_HASH_BYTES: u64 = 32;
const MAX_FIELD_BYTES: u64 = 120;

/// One per deployment, shared. Serial hash -> passport ID.
public struct Registry has key {
    id: UID,
    serials: Table<vector<u8>, ID>,
    count: u64,
}

/// The device passport. Deliberately `key` only (no `store`).
public struct DevicePassport has key {
    id: UID,
    /// Device category, e.g. "laptop".
    category: String,
    make: String,
    model: String,
    /// Keyed hash of the normalized serial number (never the raw serial).
    serial_hash: vector<u8>,
    /// Who registered the device first.
    creator: address,
    created_at_ms: u64,
}

public struct PassportMinted has copy, drop {
    passport_id: ID,
    owner: address,
    category: String,
    make: String,
    model: String,
}

public struct PassportTransferred has copy, drop {
    passport_id: ID,
    from: address,
    to: address,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(Registry { id: object::new(ctx), serials: table::new(ctx), count: 0 });
}

/// Register a device and send its passport to the caller.
/// Aborts if this serial hash already has a passport.
entry fun mint(
    registry: &mut Registry,
    category: String,
    make: String,
    model: String,
    serial_hash: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(serial_hash.length() == SERIAL_HASH_BYTES, EInvalidSerialHash);
    assert!(
        category.length() <= MAX_FIELD_BYTES && make.length() <= MAX_FIELD_BYTES && model.length() <= MAX_FIELD_BYTES,
        EFieldTooLong,
    );
    assert!(!registry.serials.contains(serial_hash), EAlreadyRegistered);

    let sender = ctx.sender();
    let passport = DevicePassport {
        id: object::new(ctx),
        category,
        make,
        model,
        serial_hash,
        creator: sender,
        created_at_ms: clock.timestamp_ms(),
    };
    let passport_id = object::id(&passport);
    registry.serials.add(passport.serial_hash, passport_id);
    registry.count = registry.count + 1;

    event::emit(PassportMinted {
        passport_id,
        owner: sender,
        category: passport.category,
        make: passport.make,
        model: passport.model,
    });
    transfer::transfer(passport, sender);
}

/// Hand the passport (and with it, app access to the device's repair memory)
/// to the next owner. The only way a passport can move.
entry fun transfer_passport(passport: DevicePassport, to: address, ctx: &TxContext) {
    assert!(to != ctx.sender(), ESameOwner);
    event::emit(PassportTransferred {
        passport_id: object::id(&passport),
        from: ctx.sender(),
        to,
    });
    transfer::transfer(passport, to);
}

public fun is_registered(registry: &Registry, serial_hash: &vector<u8>): bool {
    registry.serials.contains(*serial_hash)
}

public fun passport_for(registry: &Registry, serial_hash: &vector<u8>): ID {
    *registry.serials.borrow(*serial_hash)
}

public fun count(registry: &Registry): u64 { registry.count }

public fun category(p: &DevicePassport): String { p.category }

public fun make(p: &DevicePassport): String { p.make }

public fun model(p: &DevicePassport): String { p.model }

public fun serial_hash(p: &DevicePassport): vector<u8> { p.serial_hash }

public fun creator(p: &DevicePassport): address { p.creator }

public fun created_at_ms(p: &DevicePassport): u64 { p.created_at_ms }

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) { init(ctx) }
