#[derive(Debug)]
pub enum Core {
    MiSTer(String),
    Pocket(String),
}

impl PartialEq for Core {
    fn eq(&self, other: &Core) -> bool {
        match self {
            Core::MiSTer(value_a) => match other {
                Core::MiSTer(value_b) => value_a == value_b,
                Core::Pocket(value_b) => value_a == &pocket_core_to_mister_core(value_b),
            },
            Core::Pocket(value_a) => match other {
                Core::Pocket(value_b) => value_a == value_b,
                Core::MiSTer(value_b) => value_a == &mister_core_to_pocket_core(value_b),
            },
        }
    }
}

fn mister_core_to_pocket_core(core: &str) -> String {
    // might be better to load these in
    if core == "NES" {
        return String::from("nes");
    }

    if core == "GAMEBOY" {
        return String::from("gbc");
    }

    if core == "GBA" {
        return String::from("gba");
    }

    if core == "Genesis" {
        return String::from("genesis");
    }

    if core == "NEOGEO" {
        return String::from("ng");
    }

    if core == "TGFX16" {
        return String::from("pce");
    }

    if core == "SNES" {
        return String::from("snes");
    }

    if core == "SMS" {
        return String::from("sms");
    }

    if core == "Arduboy" {
        return String::from("arduboy");
    }

    if core == "SuperVision" {
        return String::from("supervision");
    }

    return String::from(core.to_ascii_lowercase());
}

fn pocket_core_to_mister_core(core: &str) -> String {
    // might be better to load these in
    if core == "nes" {
        return String::from("NES");
    }

    if core == "gbc" {
        return String::from("GAMEBOY");
    }

    if core == "gb" {
        return String::from("GAMEBOY");
    }

    if core == "gba" {
        return String::from("GBA");
    }

    if core == "genesis" {
        return String::from("Genesis");
    }

    if core == "ng" {
        return String::from("NEOGEO");
    }

    if core == "pce" {
        return String::from("TGFX16");
    }

    if core == "snes" {
        return String::from("SNES");
    }

    if core == "sms" {
        return String::from("SMS");
    }

    if core == "gg" {
        return String::from("SMS");
    }

    if core == "arduboy" {
        return String::from("Arduboy");
    }

    if core == "supervision" {
        return String::from("SuperVision");
    }

    return String::from(core.to_ascii_lowercase());
}

#[test]
fn self_compare() {
    let mister_core_a = Core::MiSTer(String::from("SNES"));
    let mister_core_b = Core::MiSTer(String::from("SNES"));
    assert_eq!(mister_core_a, mister_core_b);

    let mister_core_a = Core::MiSTer(String::from("PSX"));
    assert_ne!(mister_core_a, mister_core_b);
}

#[test]
fn things_that_should_match() {
    let mister_core = Core::MiSTer(String::from("SNES"));
    let pocket_core = Core::Pocket(String::from("snes"));
    assert_eq!(mister_core, pocket_core);

    let mister_core = Core::MiSTer(String::from("GAMEBOY"));
    let pocket_core = Core::Pocket(String::from("gbc"));
    assert_eq!(pocket_core, mister_core);
}

#[test]
fn things_that_shouldnt_match() {
    let mister_core = Core::MiSTer(String::from("PSX"));
    let pocket_core = Core::Pocket(String::from("snes"));
    assert_ne!(mister_core, pocket_core);
    assert_ne!(pocket_core, mister_core);
}
