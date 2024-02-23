use super::IntOrHexString;
use bitflags::bitflags;
use serde::{Deserialize, Serialize};

bitflags! {
    struct ParametersBitmapFlags: u32 {
        const CoreSpecific = 1 << 1;
        const ReadOnly = 1 << 3;
        const InstanceJSON = 1 << 4;
        const PlatformIndexLow = 1 << 24;
        const PlatformIndexHigh = 1 << 25;

        // The source may set any bits
        const _ = !0;
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SlotParameters(IntOrHexString);

impl Default for SlotParameters {
    fn default() -> SlotParameters {
        Self(IntOrHexString::Int(3))
    }
}

impl From<&str> for SlotParameters {
    fn from(value: &str) -> Self {
        SlotParameters(IntOrHexString::HexString(String::from(value)))
    }
}

impl From<u32> for SlotParameters {
    fn from(value: u32) -> Self {
        SlotParameters(IntOrHexString::Int(value))
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ParsedParams {
    pub core_specific: bool,
    pub platform_index: usize,
}

impl From<SlotParameters> for ParsedParams {
    fn from(item: SlotParameters) -> Self {
        let mask: u32 = item.0.into();
        if let Some(mask_flags) = ParametersBitmapFlags::from_bits(mask) {
            let (low_bit, high_bit) = (
                mask_flags.contains(ParametersBitmapFlags::PlatformIndexLow),
                mask_flags.contains(ParametersBitmapFlags::PlatformIndexHigh),
            );

            let platform_index = match (low_bit, high_bit) {
                (true, true) => 3,
                (false, true) => 2,
                (true, false) => 1,
                (false, false) => 0,
            };

            return Self {
                core_specific: mask_flags.contains(ParametersBitmapFlags::CoreSpecific),
                platform_index,
            };
        }

        Self {
            core_specific: false,
            platform_index: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;

    #[test]
    fn zero_num() -> Result<()> {
        let slot_params = SlotParameters(IntOrHexString::Int(0));
        let parsed = ParsedParams::from(slot_params);
        dbg!("{:?}", &parsed);
        assert_eq!(
            parsed,
            ParsedParams {
                core_specific: false,
                platform_index: 0
            }
        );
        Ok(())
    }

    #[test]
    fn zero_hex() -> Result<()> {
        let slot_params = SlotParameters(IntOrHexString::HexString(String::from("0x0")));
        let parsed: ParsedParams = ParsedParams::from(slot_params);
        dbg!("{:?}", &parsed);
        assert_eq!(
            parsed,
            ParsedParams {
                core_specific: false,
                platform_index: 0
            }
        );
        Ok(())
    }

    #[test]
    fn core_specific_num() -> Result<()> {
        let slot_params = SlotParameters(IntOrHexString::Int(2));
        let parsed: ParsedParams = ParsedParams::from(slot_params);
        dbg!("{:?}", &parsed);
        assert_eq!(
            parsed,
            ParsedParams {
                core_specific: true,
                platform_index: 0
            }
        );
        Ok(())
    }

    #[test]
    fn core_specific_hex() -> Result<()> {
        let slot_params = SlotParameters(IntOrHexString::HexString(String::from("0x2")));
        let parsed = ParsedParams::from(slot_params);
        dbg!("{:?}", &parsed);
        assert_eq!(
            parsed,
            ParsedParams {
                core_specific: true,
                platform_index: 0
            }
        );
        Ok(())
    }

    #[test]
    fn with_index() -> Result<()> {
        let slot_params = SlotParameters(IntOrHexString::HexString(String::from("0x1000000")));
        let parsed: ParsedParams = ParsedParams::from(slot_params);
        dbg!("{:?}", &parsed);
        assert_eq!(
            parsed,
            ParsedParams {
                core_specific: false,
                platform_index: 1
            }
        );

        Ok(())
    }

    #[test]
    fn with_all_and_other_bits() -> Result<()> {
        let mask = ParametersBitmapFlags::CoreSpecific
            | ParametersBitmapFlags::PlatformIndexLow
            | ParametersBitmapFlags::PlatformIndexHigh;

        let slot_params = SlotParameters(IntOrHexString::Int(mask.bits() | 1 << 6 | 1 << 26));
        let parsed = ParsedParams::from(slot_params);
        dbg!("{:?}", &parsed);
        assert_eq!(
            parsed,
            ParsedParams {
                core_specific: true,
                platform_index: 3
            }
        );

        Ok(())
    }
}
