from enum import Enum

class ProcessConditionEnum(str, Enum):
    GREY = 'grey'
    PERBAIKAN = 'perbaikan'

    PFP = 'pfp'
    OPTICWHITE = 'optic_white'
    
    DYEING = 'dyeing'
    PRINTING = 'printing'

    SERBLEACH = 'ser_bleach'
    RESINFINISH = 'resin_finish'

class OpjProcessEnum(str, Enum):
    DISPERSE = "DISPERSE"
    REACTIVE = "REACTIVE"
    PIGMENT = "PIGMENT"

class PeTypeEnum(str, Enum):
    PE_I_KRG_PE = "PE-I (Krg) PE"
    PE_II_KRG_PE = "PE-II (Krg) PE"

class FoldingEnum(str, Enum):
    YARD = "Yard"
    GULUNG = "Gulung"

class FaceDirectionEnum(str, Enum):
    MUKA_KE_DALAM = "Muka ke Dalam"
    MUKA_KE_LUAR = "Muka ke Luar"

class PrintingMachineEnum(str, Enum):
    ROTARY = "Rotary"
    FLAT = "Flat"

