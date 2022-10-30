#[derive(Debug, PartialEq)]
pub enum SupportedCore {
    GB,
    GBC,
    GBA,
    TGFX16,
    NES,
    SNES,
    GameGear,
    MasterSystem,
    Genesis,
    NEOGEO,
    Arduboy,
    SuperVision,
}

pub trait TransformCore {
    fn to_pocket(&self) -> String;
    fn to_mister(&self) -> String;

    fn from_pocket(name: &str) -> Option<SupportedCore>;
    fn from_mister(name: &str) -> Option<SupportedCore>;

    fn pocket_folder(&self) -> String;
}

impl TransformCore for SupportedCore {
    fn to_pocket(&self) -> String {
        String::from(match self {
            SupportedCore::Arduboy => "arduboy",
            SupportedCore::GameGear => "gg",
            SupportedCore::GB => "gb",
            SupportedCore::GBA => "gba",
            SupportedCore::GBC => "gbc",
            SupportedCore::Genesis => "genesis",
            SupportedCore::MasterSystem => "sms",
            SupportedCore::NEOGEO => "ng",
            SupportedCore::NES => "nes",
            SupportedCore::SNES => "snes",
            SupportedCore::SuperVision => "supervision",
            SupportedCore::TGFX16 => "pce",
        })
    }

    fn to_mister(&self) -> String {
        String::from(match self {
            SupportedCore::Arduboy => "Arduboy",
            SupportedCore::GameGear => "SMS",
            SupportedCore::GB => "GAMEBOY",
            SupportedCore::GBA => "GBA",
            SupportedCore::GBC => "GAMEBOY",
            SupportedCore::Genesis => "Genesis",
            SupportedCore::MasterSystem => "SMS",
            SupportedCore::NEOGEO => "NEOGEO",
            SupportedCore::NES => "NES",
            SupportedCore::SNES => "SNES",
            SupportedCore::SuperVision => "SuperVision",
            SupportedCore::TGFX16 => "TGFX16",
        })
    }

    fn from_pocket(name: &str) -> Option<SupportedCore> {
        match name {
            "arduboy" => Some(SupportedCore::Arduboy),
            "gb" => Some(SupportedCore::GB),
            "gba" => Some(SupportedCore::GBA),
            "gbc" => Some(SupportedCore::GBC),
            "genesis" => Some(SupportedCore::Genesis),
            "gg" => Some(SupportedCore::GameGear),
            "nes" => Some(SupportedCore::NES),
            "ng" => Some(SupportedCore::NEOGEO),
            "pce" => Some(SupportedCore::TGFX16),
            "sms" => Some(SupportedCore::MasterSystem),
            "snes" => Some(SupportedCore::SNES),
            "supervision" => Some(SupportedCore::SuperVision),
            _ => None,
        }
    }

    fn from_mister(name: &str) -> Option<SupportedCore> {
        // Some cores on the MiSTer do double duty (GAMEBOY, SMS) will need to work out
        // How to deal with that (save file header? try to find the full rom name?)
        match name {
            "Arduboy" => Some(SupportedCore::Arduboy),
            "NES" => Some(SupportedCore::NES),
            "SNES" => Some(SupportedCore::SNES),
            "GAMEBOY" => Some(SupportedCore::GBC),
            "GBA" => Some(SupportedCore::GBA),
            "SMS" => Some(SupportedCore::MasterSystem),
            "TGFX16" => Some(SupportedCore::TGFX16),
            "NEOGEO" => Some(SupportedCore::NEOGEO),
            "Genesis" => Some(SupportedCore::Genesis),
            "SuperVision" => Some(SupportedCore::SuperVision),
            _ => None,
        }
    }

    fn pocket_folder(&self) -> String {
        String::from(match self {
            Self::NEOGEO => "Mazamars312.NeoGeo",
            _ => "common",
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn self_compare() {
        let mister_core_a = SupportedCore::from_mister("SNES").unwrap();
        let mister_core_b = SupportedCore::from_mister("SNES").unwrap();
        assert_eq!(mister_core_a, mister_core_b);

        let mister_core_a = SupportedCore::from_mister("NES").unwrap();
        assert_ne!(mister_core_a, mister_core_b);
    }

    #[test]
    fn things_that_should_match() {
        let mister_core = SupportedCore::from_mister("SNES").unwrap();
        let pocket_core = SupportedCore::from_pocket("snes").unwrap();
        assert_eq!(mister_core, pocket_core);

        let mister_core = SupportedCore::from_mister("GAMEBOY").unwrap();
        let pocket_core = SupportedCore::from_pocket("gbc").unwrap();
        assert_eq!(pocket_core.to_mister(), mister_core.to_mister());
    }

    #[test]
    fn things_that_should_return_none() {
        let mister_core = SupportedCore::from_mister("PSX");
        let pocket_core = SupportedCore::from_pocket("galaga");
        assert_eq!(mister_core, None);
        assert_eq!(pocket_core, None);
    }
}
