
from sqlalchemy import Enum as SQLAlchemyEnum

# Central registry
ENUM_NAMES = {
    "ledgerref": "ledger_ref_enum",
    "ledgerlocation": "ledger_location_enum",
    "processconditionenum": "process_condition_enum",
    "opjprocessenum": "opj_process_enum",
    "petypeenum": "pe_type_enum",
    "foldingenum": "folding_enum",
    "facedirectionenum": "face_direction_enum",
    "printingmachineenum": "printing_machine_enum",
    # add more here
}

def enum_column(enum_class, **kwargs):
    """
    Automatically picks the right database enum name from ENUM_NAMES.
    """
    key = enum_class.__name__.lower()

    if key not in ENUM_NAMES:
        raise ValueError(f"No enum name mapping found for {enum_class.__name__}")

    kwargs.pop("name", None)

    return SQLAlchemyEnum(enum_class, name=ENUM_NAMES[key], **kwargs)