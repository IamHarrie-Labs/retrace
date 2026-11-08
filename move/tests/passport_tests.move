#[test_only]
module retrace::passport_tests;

use retrace::passport::{Self, Registry, DevicePassport};
use std::string::utf8;
use sui::clock;
use sui::test_scenario as ts;

const SELLER: address = @0xA11CE;
const BUYER: address = @0xB0B;

fun hash(seed: u8): vector<u8> {
    let mut v = vector[];
    let mut i = 0u64;
    while (i < 32) { v.push_back(seed); i = i + 1; };
    v
}

fun setup(): ts::Scenario {
    let mut s = ts::begin(SELLER);
    passport::init_for_testing(s.ctx());
    s
}

fun mint_as(s: &mut ts::Scenario, who: address, serial: vector<u8>) {
    s.next_tx(who);
    let mut registry = s.take_shared<Registry>();
    let clk = clock::create_for_testing(s.ctx());
    passport::mint(&mut registry, utf8(b"laptop"), utf8(b"Lenovo"), utf8(b"ThinkPad T480"), serial, &clk, s.ctx());
    clk.destroy_for_testing();
    ts::return_shared(registry);
}

#[test]
fun mint_registers_serial_and_sends_to_creator() {
    let mut s = setup();
    mint_as(&mut s, SELLER, hash(1));
    s.next_tx(SELLER);
    let p = s.take_from_sender<DevicePassport>();
    assert!(p.creator() == SELLER);
    assert!(p.model() == utf8(b"ThinkPad T480"));
    let registry = s.take_shared<Registry>();
    assert!(registry.is_registered(&hash(1)));
    assert!(registry.passport_for(&hash(1)) == object::id(&p));
    assert!(registry.count() == 1);
    ts::return_shared(registry);
    s.return_to_sender(p);
    s.end();
}

#[test, expected_failure(abort_code = passport::EAlreadyRegistered)]
fun same_serial_cannot_be_registered_twice() {
    let mut s = setup();
    mint_as(&mut s, SELLER, hash(7));
    // A different wallet tries to register the same device with a clean history.
    mint_as(&mut s, BUYER, hash(7));
    s.end();
}

#[test, expected_failure(abort_code = passport::EInvalidSerialHash)]
fun serial_hash_must_be_32_bytes() {
    let mut s = setup();
    mint_as(&mut s, SELLER, b"short");
    s.end();
}

#[test]
fun transfer_moves_ownership() {
    let mut s = setup();
    mint_as(&mut s, SELLER, hash(2));
    s.next_tx(SELLER);
    let p = s.take_from_sender<DevicePassport>();
    passport::transfer_passport(p, BUYER, s.ctx());
    s.next_tx(BUYER);
    assert!(s.has_most_recent_for_sender<DevicePassport>());
    s.next_tx(SELLER);
    assert!(!s.has_most_recent_for_sender<DevicePassport>());
    s.end();
}

#[test, expected_failure(abort_code = passport::ESameOwner)]
fun cannot_transfer_to_self() {
    let mut s = setup();
    mint_as(&mut s, SELLER, hash(3));
    s.next_tx(SELLER);
    let p = s.take_from_sender<DevicePassport>();
    passport::transfer_passport(p, SELLER, s.ctx());
    s.end();
}
