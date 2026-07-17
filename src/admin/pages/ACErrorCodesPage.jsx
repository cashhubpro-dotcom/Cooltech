import { errorCodesApi } from '../services/api';
import { useState, useEffect, useMemo } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SectionHdr, KCard } from '../components/ui/Cards';

// ─── Error code database ──────────────────────────────────────────────────────
const ERROR_DB = {
  Daikin: [{
    code: "A1",
    meaning: "Indoor PCB fault",
    cause: "Defective PCB or loose wiring",
    fix: "Replace indoor PCB, check all connectors",
    severity: "high"
  }, {
    code: "A3",
    meaning: "Drain level control system fault",
    cause: "Float switch stuck or blocked drain",
    fix: "Clean drain pan, check float switch",
    severity: "medium"
  }, {
    code: "A5",
    meaning: "Freeze protection / overheat protection",
    cause: "Dirty filter, low gas, blocked airflow",
    fix: "Clean filter, check gas pressure",
    severity: "medium"
  }, {
    code: "A6",
    meaning: "Fan motor fault",
    cause: "Motor failure or capacitor faulty",
    fix: "Replace fan motor or capacitor",
    severity: "high"
  }, {
    code: "A9",
    meaning: "Electronic expansion valve fault",
    cause: "EEV stuck or coil open",
    fix: "Replace EEV coil or full valve",
    severity: "high"
  }, {
    code: "C4",
    meaning: "Heat exchanger sensor fault",
    cause: "Sensor open or short circuit",
    fix: "Replace indoor heat exchanger thermistor",
    severity: "medium"
  }, {
    code: "C9",
    meaning: "Suction air thermistor fault",
    cause: "Loose or failed thermistor",
    fix: "Replace suction thermistor",
    severity: "low"
  }, {
    code: "E1",
    meaning: "Outdoor PCB fault",
    cause: "PCB failure or power surge",
    fix: "Replace outdoor PCB",
    severity: "high"
  }, {
    code: "E3",
    meaning: "High pressure fault",
    cause: "Dirty condenser coil, refrigerant overcharge",
    fix: "Clean outdoor coil, check gas charge",
    severity: "high"
  }, {
    code: "E4",
    meaning: "Low pressure fault",
    cause: "Gas leak or blocked filter drier",
    fix: "Detect and fix leak, recharge gas",
    severity: "high"
  }, {
    code: "E5",
    meaning: "Compressor motor lock",
    cause: "Compressor seized or overloaded",
    fix: "Replace compressor",
    severity: "critical"
  }, {
    code: "E6",
    meaning: "Compressor startup failure",
    cause: "Low voltage, bad capacitor",
    fix: "Check power supply, replace capacitor",
    severity: "high"
  }, {
    code: "E7",
    meaning: "Fan motor fault (outdoor)",
    cause: "Fan motor or capacitor failure",
    fix: "Replace outdoor fan motor",
    severity: "high"
  }, {
    code: "E8",
    meaning: "Input overcurrent protection",
    cause: "Short circuit or overload",
    fix: "Check electrical supply and wiring",
    severity: "critical"
  }, {
    code: "F3",
    meaning: "Discharge pipe temperature too high",
    cause: "Low refrigerant or blocked filter drier",
    fix: "Check gas level, replace drier",
    severity: "high"
  }, {
    code: "H6",
    meaning: "DC motor position sensor fault",
    cause: "Sensor or motor wiring issue",
    fix: "Replace indoor motor or sensor",
    severity: "medium"
  }, {
    code: "J3",
    meaning: "Discharge pipe thermistor fault",
    cause: "Open or short thermistor",
    fix: "Replace discharge thermistor",
    severity: "medium"
  }, {
    code: "L4",
    meaning: "Radiation fin temp too high",
    cause: "Blocked airflow around inverter",
    fix: "Clean fins, check cooling fan",
    severity: "high"
  }, {
    code: "U0",
    meaning: "Refrigerant shortage",
    cause: "Gas leak or insufficient charge",
    fix: "Leak test, repair, recharge",
    severity: "critical"
  }, {
    code: "U2",
    meaning: "Low voltage / power abnormal",
    cause: "Voltage drop below 190V",
    fix: "Check power supply and stabilizer",
    severity: "medium"
  }, {
    code: "U4",
    meaning: "Communication fault indoor-outdoor",
    cause: "Signal wire loose or broken",
    fix: "Check and reconnect comm wires",
    severity: "medium"
  }, {
    code: "UF",
    meaning: "Compressor reverse rotation",
    cause: "Phase reversal in 3-phase supply",
    fix: "Swap any two phases",
    severity: "high"
  }],
  Voltas: [{
    code: "E0",
    meaning: "EEPROM error",
    cause: "PCB memory fault",
    fix: "Replace indoor PCB",
    severity: "high"
  }, {
    code: "E1",
    meaning: "Indoor ambient sensor open/short",
    cause: "Faulty room temp sensor",
    fix: "Replace ambient thermistor",
    severity: "low"
  }, {
    code: "E2",
    meaning: "Indoor coil sensor fault",
    cause: "Faulty evaporator sensor",
    fix: "Replace evaporator thermistor",
    severity: "medium"
  }, {
    code: "E3",
    meaning: "Outdoor ambient sensor fault",
    cause: "Faulty outdoor temp sensor",
    fix: "Replace outdoor ambient thermistor",
    severity: "low"
  }, {
    code: "E4",
    meaning: "Outdoor coil sensor fault",
    cause: "Faulty condenser sensor",
    fix: "Replace condenser thermistor",
    severity: "medium"
  }, {
    code: "E5",
    meaning: "Compressor discharge sensor fault",
    cause: "Faulty discharge thermistor",
    fix: "Replace discharge thermistor",
    severity: "medium"
  }, {
    code: "E6",
    meaning: "Communication fault",
    cause: "Indoor-outdoor PCB comms lost",
    fix: "Check signal wire, replace PCB",
    severity: "medium"
  }, {
    code: "F1",
    meaning: "High pressure protection",
    cause: "Dirty condenser, blocked airflow",
    fix: "Clean outdoor unit, check gas",
    severity: "high"
  }, {
    code: "F2",
    meaning: "Low pressure protection",
    cause: "Gas leak or low charge",
    fix: "Leak check and gas recharge",
    severity: "high"
  }, {
    code: "F3",
    meaning: "Anti-freeze protection",
    cause: "Dirty filter or low gas",
    fix: "Clean filter, check refrigerant",
    severity: "medium"
  }, {
    code: "F4",
    meaning: "Discharge temp protection",
    cause: "Compressor overheating",
    fix: "Check gas, clean outdoor coil",
    severity: "high"
  }, {
    code: "F5",
    meaning: "Compressor overcurrent",
    cause: "Compressor or PCB fault",
    fix: "Check compressor winding resistance",
    severity: "critical"
  }, {
    code: "H6",
    meaning: "Motor position fault",
    cause: "Hall sensor failure in fan motor",
    fix: "Replace indoor fan motor",
    severity: "medium"
  }, {
    code: "P1",
    meaning: "Voltage protection",
    cause: "Supply voltage too high or low",
    fix: "Install voltage stabilizer",
    severity: "medium"
  }, {
    code: "P2",
    meaning: "IPM module protection",
    cause: "Inverter module overheat",
    fix: "Check cooling, replace IPM if needed",
    severity: "high"
  }, {
    code: "P4",
    meaning: "IGBT module temp too high",
    cause: "Poor ventilation around outdoor unit",
    fix: "Improve airflow, clean fins",
    severity: "high"
  }],
  "Blue Star": [{
    code: "E1",
    meaning: "Room thermistor fault",
    cause: "Sensor open or shorted",
    fix: "Replace indoor room thermistor",
    severity: "low"
  }, {
    code: "E2",
    meaning: "Evaporator thermistor fault",
    cause: "Sensor disconnected",
    fix: "Reconnect or replace sensor",
    severity: "medium"
  }, {
    code: "E3",
    meaning: "Condenser thermistor fault",
    cause: "Sensor failure at outdoor unit",
    fix: "Replace condenser thermistor",
    severity: "medium"
  }, {
    code: "E4",
    meaning: "Discharge thermistor fault",
    cause: "High discharge temp or bad sensor",
    fix: "Check gas level, replace sensor",
    severity: "medium"
  }, {
    code: "E5",
    meaning: "Communication error",
    cause: "PCB comms failure",
    fix: "Check wiring, replace PCB",
    severity: "medium"
  }, {
    code: "E6",
    meaning: "Indoor fan motor fault",
    cause: "Motor or capacitor failure",
    fix: "Replace indoor fan motor",
    severity: "high"
  }, {
    code: "E7",
    meaning: "Outdoor fan motor fault",
    cause: "Motor or capacitor failure",
    fix: "Replace outdoor fan motor",
    severity: "high"
  }, {
    code: "F1",
    meaning: "High pressure cutout",
    cause: "Overcharge or blocked condenser",
    fix: "Check gas charge, clean condenser",
    severity: "high"
  }, {
    code: "F2",
    meaning: "Low pressure cutout",
    cause: "Gas leak",
    fix: "Pressure test, leak repair, recharge",
    severity: "critical"
  }, {
    code: "F3",
    meaning: "Evaporator freeze protection",
    cause: "Low airflow or low gas",
    fix: "Check filter and refrigerant",
    severity: "medium"
  }, {
    code: "F4",
    meaning: "Compressor overload protection",
    cause: "High load or winding fault",
    fix: "Check supply voltage and compressor",
    severity: "high"
  }, {
    code: "F5",
    meaning: "IPM protection",
    cause: "Inverter driver overload",
    fix: "Check load, replace IPM board",
    severity: "critical"
  }, {
    code: "P6",
    meaning: "PFC module fault",
    cause: "Power factor correction failure",
    fix: "Replace PFC module",
    severity: "high"
  }],
  LG: [{
    code: "CH01",
    meaning: "Indoor room sensor fault",
    cause: "Open or short circuit in thermistor",
    fix: "Replace indoor room thermistor",
    severity: "low"
  }, {
    code: "CH02",
    meaning: "Indoor pipe sensor fault",
    cause: "Evaporator sensor failure",
    fix: "Replace evaporator thermistor",
    severity: "medium"
  }, {
    code: "CH03",
    meaning: "Outdoor pipe sensor fault",
    cause: "Condenser sensor failure",
    fix: "Replace condenser thermistor",
    severity: "medium"
  }, {
    code: "CH04",
    meaning: "Outdoor temp sensor fault",
    cause: "Outdoor ambient sensor failure",
    fix: "Replace outdoor ambient thermistor",
    severity: "low"
  }, {
    code: "CH05",
    meaning: "Discharge temp sensor fault",
    cause: "High discharge or sensor failure",
    fix: "Check refrigerant, replace sensor",
    severity: "medium"
  }, {
    code: "CH06",
    meaning: "CT (current transformer) fault",
    cause: "CT sensor open or short",
    fix: "Replace CT sensor",
    severity: "medium"
  }, {
    code: "CH10",
    meaning: "Fan motor fault (indoor)",
    cause: "Motor or Hall sensor failure",
    fix: "Replace indoor BLDC motor",
    severity: "high"
  }, {
    code: "CH22",
    meaning: "Communication fault",
    cause: "Indoor-outdoor comm wire issue",
    fix: "Check PCB comms wire connections",
    severity: "medium"
  }, {
    code: "CH23",
    meaning: "Zero cross fault",
    cause: "Power supply frequency issue",
    fix: "Check AC power supply",
    severity: "medium"
  }, {
    code: "CH25",
    meaning: "EEPROM fault",
    cause: "Memory corruption on PCB",
    fix: "Replace indoor PCB",
    severity: "high"
  }, {
    code: "CH32",
    meaning: "High pressure fault",
    cause: "Dirty condenser or overcharge",
    fix: "Clean unit, check gas level",
    severity: "high"
  }, {
    code: "CH33",
    meaning: "Low pressure fault",
    cause: "Gas leak or restriction",
    fix: "Leak test, recharge",
    severity: "critical"
  }, {
    code: "CH34",
    meaning: "Compressor overload",
    cause: "High discharge temp",
    fix: "Check gas, clean condenser",
    severity: "high"
  }, {
    code: "CH38",
    meaning: "Outdoor fan motor fault",
    cause: "Motor failure",
    fix: "Replace outdoor fan motor",
    severity: "high"
  }, {
    code: "CH44",
    meaning: "Inverter compressor fault",
    cause: "IGBT or compressor issue",
    fix: "Check inverter board and compressor",
    severity: "critical"
  }, {
    code: "CH67",
    meaning: "PFC circuit fault",
    cause: "Power factor correction failure",
    fix: "Replace inverter board",
    severity: "high"
  }],
  Samsung: [{
    code: "E1-21",
    meaning: "Indoor room thermistor open",
    cause: "Thermistor disconnected or faulty",
    fix: "Reconnect or replace thermistor",
    severity: "low"
  }, {
    code: "E1-22",
    meaning: "Indoor room thermistor short",
    cause: "Thermistor shorted",
    fix: "Replace room thermistor",
    severity: "low"
  }, {
    code: "E2-21",
    meaning: "Indoor pipe thermistor open",
    cause: "Evaporator sensor failure",
    fix: "Replace pipe thermistor",
    severity: "medium"
  }, {
    code: "E3-21",
    meaning: "Outdoor thermistor fault",
    cause: "Outdoor ambient sensor failure",
    fix: "Replace outdoor thermistor",
    severity: "low"
  }, {
    code: "E4-21",
    meaning: "Discharge pipe thermistor fault",
    cause: "High temp or sensor failure",
    fix: "Check refrigerant, replace sensor",
    severity: "medium"
  }, {
    code: "E5-12",
    meaning: "High pressure protection",
    cause: "Overcharge or blocked airflow",
    fix: "Check gas, clean outdoor unit",
    severity: "high"
  }, {
    code: "E6-12",
    meaning: "Low pressure protection",
    cause: "Gas leak or low charge",
    fix: "Pressure test, fix leak, recharge",
    severity: "critical"
  }, {
    code: "E7-12",
    meaning: "Compressor overload",
    cause: "High suction pressure or bad compressor",
    fix: "Check refrigerant and compressor",
    severity: "high"
  }, {
    code: "E8-21",
    meaning: "Indoor fan motor fault",
    cause: "Motor failure or PCB issue",
    fix: "Replace indoor fan motor",
    severity: "high"
  }, {
    code: "E9-12",
    meaning: "Outdoor fan motor fault",
    cause: "Fan motor or capacitor failure",
    fix: "Replace outdoor fan motor",
    severity: "high"
  }, {
    code: "E1-11",
    meaning: "Communication error",
    cause: "Comms wire fault",
    fix: "Check and replace communication wire",
    severity: "medium"
  }, {
    code: "E6-22",
    meaning: "Inverter PCB fault",
    cause: "IGBT failure or drive fault",
    fix: "Replace inverter PCB",
    severity: "critical"
  }, {
    code: "E4-26",
    meaning: "EEPROM error",
    cause: "PCB memory failure",
    fix: "Replace main PCB",
    severity: "high"
  }],
  Hitachi: [{
    code: "01",
    meaning: "Room thermistor open",
    cause: "Sensor disconnected",
    fix: "Reconnect or replace thermistor",
    severity: "low"
  }, {
    code: "02",
    meaning: "Indoor coil thermistor open",
    cause: "Evaporator sensor failure",
    fix: "Replace indoor coil thermistor",
    severity: "medium"
  }, {
    code: "03",
    meaning: "Outdoor coil thermistor fault",
    cause: "Condenser sensor issue",
    fix: "Replace outdoor coil thermistor",
    severity: "medium"
  }, {
    code: "04",
    meaning: "Outdoor thermistor fault",
    cause: "Outdoor ambient sensor failure",
    fix: "Replace outdoor ambient thermistor",
    severity: "low"
  }, {
    code: "05",
    meaning: "Discharge thermistor fault",
    cause: "High discharge or sensor failure",
    fix: "Check refrigerant, replace sensor",
    severity: "medium"
  }, {
    code: "06",
    meaning: "High pressure protection",
    cause: "Dirty condenser or overcharge",
    fix: "Clean outdoor unit, check gas",
    severity: "high"
  }, {
    code: "07",
    meaning: "Low pressure protection",
    cause: "Gas leak",
    fix: "Leak test, repair, recharge gas",
    severity: "critical"
  }, {
    code: "08",
    meaning: "Communication fault",
    cause: "Indoor-outdoor comm failure",
    fix: "Check signal cable connections",
    severity: "medium"
  }, {
    code: "09",
    meaning: "Fan motor fault",
    cause: "Indoor fan motor failure",
    fix: "Replace indoor fan motor",
    severity: "high"
  }, {
    code: "11",
    meaning: "Compressor overload",
    cause: "High discharge temperature",
    fix: "Check refrigerant level and condenser",
    severity: "high"
  }, {
    code: "13",
    meaning: "Freeze protection",
    cause: "Low airflow or low refrigerant",
    fix: "Clean filter, check gas level",
    severity: "medium"
  }, {
    code: "16",
    meaning: "Outdoor fan motor fault",
    cause: "Motor or capacitor failure",
    fix: "Replace outdoor fan motor",
    severity: "high"
  }, {
    code: "20",
    meaning: "Inverter module protection",
    cause: "IGBT overheat or fault",
    fix: "Check heat dissipation, replace module",
    severity: "critical"
  }],
  Carrier: [{
    code: "E1",
    meaning: "Indoor ambient sensor error",
    cause: "Sensor open or short",
    fix: "Replace indoor ambient thermistor",
    severity: "low"
  }, {
    code: "E2",
    meaning: "Indoor coil sensor error",
    cause: "Evaporator sensor failure",
    fix: "Replace indoor coil sensor",
    severity: "medium"
  }, {
    code: "E3",
    meaning: "Outdoor ambient sensor error",
    cause: "Outdoor sensor failure",
    fix: "Replace outdoor ambient sensor",
    severity: "low"
  }, {
    code: "E4",
    meaning: "Outdoor coil sensor error",
    cause: "Condenser sensor failure",
    fix: "Replace outdoor coil sensor",
    severity: "medium"
  }, {
    code: "E5",
    meaning: "Compressor discharge sensor",
    cause: "High temp or sensor failure",
    fix: "Check refrigerant, replace sensor",
    severity: "medium"
  }, {
    code: "E6",
    meaning: "Communication error",
    cause: "PCB comms failure",
    fix: "Check wiring between boards",
    severity: "medium"
  }, {
    code: "F1",
    meaning: "High pressure protection",
    cause: "Dirty condenser or overcharge",
    fix: "Clean outdoor unit, adjust gas",
    severity: "high"
  }, {
    code: "F2",
    meaning: "Low pressure protection",
    cause: "Gas leak or low charge",
    fix: "Leak test, recharge refrigerant",
    severity: "critical"
  }, {
    code: "F3",
    meaning: "Anti-freeze protection",
    cause: "Low airflow or low gas",
    fix: "Clean filter, check refrigerant",
    severity: "medium"
  }, {
    code: "F4",
    meaning: "Compressor overload",
    cause: "Overheating or power issue",
    fix: "Check power supply and compressor",
    severity: "high"
  }, {
    code: "F5",
    meaning: "IGBT module protection",
    cause: "Inverter overload",
    fix: "Check load and replace IGBT if needed",
    severity: "critical"
  }, {
    code: "P1",
    meaning: "Overvoltage / undervoltage",
    cause: "Unstable power supply",
    fix: "Install stabilizer, check voltage",
    severity: "medium"
  }, {
    code: "P2",
    meaning: "Phase loss protection",
    cause: "One phase missing in 3-phase supply",
    fix: "Check electrical supply panel",
    severity: "critical"
  }],
  Mitsubishi: [{
    code: "E0",
    meaning: "Remote control error",
    cause: "Signal mismatch or PCB fault",
    fix: "Re-pair remote or replace PCB",
    severity: "low"
  }, {
    code: "E1",
    meaning: "Room temp sensor fault",
    cause: "Sensor open or short",
    fix: "Replace room thermistor",
    severity: "low"
  }, {
    code: "E2",
    meaning: "Indoor pipe sensor fault",
    cause: "Evaporator sensor failure",
    fix: "Replace pipe thermistor",
    severity: "medium"
  }, {
    code: "E3",
    meaning: "Outdoor pipe sensor fault",
    cause: "Condenser sensor issue",
    fix: "Replace outdoor pipe sensor",
    severity: "medium"
  }, {
    code: "E4",
    meaning: "Outdoor temp sensor fault",
    cause: "Outdoor ambient sensor failure",
    fix: "Replace outdoor thermistor",
    severity: "low"
  }, {
    code: "E5",
    meaning: "Discharge temp sensor fault",
    cause: "Sensor or high discharge",
    fix: "Check gas level, replace sensor",
    severity: "medium"
  }, {
    code: "E6",
    meaning: "Indoor fan motor fault",
    cause: "Motor or control board fault",
    fix: "Replace indoor fan motor",
    severity: "high"
  }, {
    code: "P1",
    meaning: "High discharge temperature",
    cause: "Low refrigerant or dirty condenser",
    fix: "Check gas, clean outdoor coil",
    severity: "high"
  }, {
    code: "P2",
    meaning: "Outdoor fan motor fault",
    cause: "Fan motor failure",
    fix: "Replace outdoor fan motor",
    severity: "high"
  }, {
    code: "P4",
    meaning: "Drain pump fault",
    cause: "Drain pump blocked or failed",
    fix: "Clean or replace drain pump",
    severity: "medium"
  }, {
    code: "P6",
    meaning: "Freezing protection",
    cause: "Low gas or blocked filter",
    fix: "Clean filter, check refrigerant",
    severity: "medium"
  }, {
    code: "P8",
    meaning: "Outdoor unit fault",
    cause: "Multiple outdoor unit protection",
    fix: "Check outdoor unit power and PCB",
    severity: "high"
  }, {
    code: "U1",
    meaning: "Reverse phase",
    cause: "Phase order reversed (3-phase)",
    fix: "Swap two phases in supply",
    severity: "high"
  }, {
    code: "U2",
    meaning: "Low voltage protection",
    cause: "Voltage below 187V",
    fix: "Check supply, install stabilizer",
    severity: "medium"
  }, {
    code: "U3",
    meaning: "Open phase protection",
    cause: "Missing phase in 3-phase supply",
    fix: "Restore all 3 phases",
    severity: "critical"
  }, {
    code: "U4",
    meaning: "Communication fault",
    cause: "Indoor-outdoor signal wire fault",
    fix: "Replace signal cable",
    severity: "medium"
  }, {
    code: "U6",
    meaning: "Compressor overcurrent",
    cause: "Compressor failure or IGBT fault",
    fix: "Replace compressor or inverter board",
    severity: "critical"
  }],
  Panasonic: [{
    code: "H00",
    meaning: "No error",
    cause: "Normal operation",
    fix: "No action needed",
    severity: "none"
  }, {
    code: "H11",
    meaning: "Indoor-outdoor communication fault",
    cause: "Signal wire loose or PCB faulty",
    fix: "Check communication wires",
    severity: "medium"
  }, {
    code: "H12",
    meaning: "Fan motor fault (indoor)",
    cause: "Motor or PCB fault",
    fix: "Replace indoor fan motor",
    severity: "high"
  }, {
    code: "H15",
    meaning: "Compressor thermistor fault",
    cause: "Sensor open or short",
    fix: "Replace compressor thermistor",
    severity: "medium"
  }, {
    code: "H16",
    meaning: "Compressor overcurrent",
    cause: "High load or faulty compressor",
    fix: "Check compressor and power supply",
    severity: "critical"
  }, {
    code: "H19",
    meaning: "Indoor fan motor fault (DC)",
    cause: "Hall IC or motor failure",
    fix: "Replace indoor DC fan motor",
    severity: "high"
  }, {
    code: "H23",
    meaning: "Indoor pipe thermistor fault",
    cause: "Evaporator sensor failure",
    fix: "Replace pipe thermistor",
    severity: "medium"
  }, {
    code: "H27",
    meaning: "Outdoor thermistor fault",
    cause: "Outdoor sensor failure",
    fix: "Replace outdoor thermistor",
    severity: "low"
  }, {
    code: "H28",
    meaning: "Outdoor discharge thermistor fault",
    cause: "Discharge sensor failure",
    fix: "Replace discharge thermistor",
    severity: "medium"
  }, {
    code: "H33",
    meaning: "High pressure protection",
    cause: "Dirty condenser or gas overcharge",
    fix: "Clean outdoor unit, check gas",
    severity: "high"
  }, {
    code: "H34",
    meaning: "Low pressure protection",
    cause: "Gas leak",
    fix: "Detect leak, fix, and recharge",
    severity: "critical"
  }, {
    code: "H38",
    meaning: "Outdoor fan motor fault",
    cause: "Fan motor failure",
    fix: "Replace outdoor fan motor",
    severity: "high"
  }, {
    code: "H42",
    meaning: "Outdoor PCB fault",
    cause: "PCB component failure",
    fix: "Replace outdoor PCB",
    severity: "high"
  }, {
    code: "F90",
    meaning: "Refrigerant shortage",
    cause: "Low gas charge",
    fix: "Check for leaks, recharge",
    severity: "critical"
  }, {
    code: "F91",
    meaning: "Refrigerant overcharge",
    cause: "Too much refrigerant",
    fix: "Recover excess refrigerant",
    severity: "high"
  }],
  Godrej: [{
    code: "E1",
    meaning: "Indoor ambient sensor fault",
    cause: "Thermistor open or short",
    fix: "Replace indoor ambient thermistor",
    severity: "low"
  }, {
    code: "E2",
    meaning: "Indoor coil sensor fault",
    cause: "Evaporator sensor failure",
    fix: "Replace indoor coil thermistor",
    severity: "medium"
  }, {
    code: "E3",
    meaning: "Outdoor ambient sensor fault",
    cause: "Sensor failure",
    fix: "Replace outdoor ambient thermistor",
    severity: "low"
  }, {
    code: "E4",
    meaning: "Outdoor coil sensor fault",
    cause: "Condenser sensor failure",
    fix: "Replace outdoor coil thermistor",
    severity: "medium"
  }, {
    code: "E5",
    meaning: "Communication error",
    cause: "Comms wire or PCB failure",
    fix: "Check communication cables and PCB",
    severity: "medium"
  }, {
    code: "F1",
    meaning: "High pressure protection",
    cause: "Dirty condenser coil",
    fix: "Clean condenser, check refrigerant",
    severity: "high"
  }, {
    code: "F2",
    meaning: "Low pressure protection",
    cause: "Gas leak or low charge",
    fix: "Leak test, repair, recharge",
    severity: "critical"
  }, {
    code: "F3",
    meaning: "Freeze protection activated",
    cause: "Low airflow or low gas",
    fix: "Clean filter, check refrigerant",
    severity: "medium"
  }, {
    code: "F4",
    meaning: "Compressor overload protection",
    cause: "High discharge temperature",
    fix: "Check refrigerant and outdoor unit",
    severity: "high"
  }, {
    code: "P1",
    meaning: "Over/under voltage protection",
    cause: "Unstable power supply",
    fix: "Install voltage stabilizer",
    severity: "medium"
  }]
};
const BRANDS = Object.keys(ERROR_DB);
const SEVERITY_MAP = {
  none: {
    label: "Normal",
    color: "var(--text-muted)",
    bg: "var(--bg)"
  },
  low: {
    label: "Low",
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  medium: {
    label: "Medium",
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  high: {
    label: "High",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  critical: {
    label: "Critical",
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  }
};
const BRAND_COLOR = {
  Daikin: "var(--x0073cf)",
  Voltas: "var(--xe8171e)",
  "Blue Star": "var(--x003da5)",
  LG: "var(--xa50034)",
  Samsung: "var(--x1428a0)",
  Hitachi: "var(--xe60000)",
  Carrier: "var(--x004b8d)",
  Mitsubishi: "var(--xe4002b)",
  Panasonic: "var(--x0047bb)",
  Godrej: "var(--x007b5e)"
};

// ─── ACErrorCodesPage ─────────────────────────────────────────────────────────
const ACErrorCodesPage = () => {
  const [dbLoaded, setDbLoaded] = useState(false);
  const [apiCodes, setApiCodes] = useState({});
  useEffect(() => {
    errorCodesApi.list({
      limit: 1000
    }).then(res => {
      const raw = res?.data || res || [];
      if (raw.length > 0) {
        // Group by brand and merge into ERROR_DB structure
        const grouped = {};
        raw.forEach(c => {
          const b = c.brand || 'Other';
          if (!grouped[b]) grouped[b] = [];
          grouped[b].push({
            code: c.code,
            meaning: c.description,
            cause: c.cause || '',
            fix: c.solution || '',
            severity: c.severity === 'critical' ? 'high' : c.severity === 'info' ? 'low' : 'medium'
          });
        });
        setApiCodes(grouped);
        setDbLoaded(true);
      }
    }).catch(() => {});
  }, []);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '',
    brand: 'Daikin',
    description: '',
    cause: '',
    solution: '',
    severity: 'warning',
    category: 'Other'
  });
  const [addSaving, setAddSaving] = useState(false);
  const handleAddCode = async () => {
    if (!addForm.code.trim() || !addForm.description.trim()) return alert('Code and description are required.');
    setAddSaving(true);
    try {
      const created = await errorCodesApi.create(addForm);
      setApiCodes(prev => {
        const updated = {
          ...prev
        };
        if (!updated[addForm.brand]) updated[addForm.brand] = [];
        updated[addForm.brand] = [...updated[addForm.brand], {
          code: created.code,
          meaning: created.description,
          cause: created.cause || '',
          fix: created.solution || '',
          severity: created.severity === 'critical' ? 'high' : 'medium'
        }];
        return updated;
      });
      setDbLoaded(true);
      setShowAdd(false);
      setAddForm({
        code: '',
        brand: 'Daikin',
        description: '',
        cause: '',
        solution: '',
        severity: 'warning',
        category: 'Other'
      });
    } catch (e) {
      alert('Add failed: ' + e.message);
    } finally {
      setAddSaving(false);
    }
  };
  const handleDeleteCode = async (brand, codeVal) => {
    if (!window.confirm(`Delete error code ${codeVal}?`)) return;
    try {
      // Find the doc ID from API and delete
      const res = await errorCodesApi.list({
        limit: 2000
      });
      const all = res?.data || res || [];
      const doc = all.find(c => c.code === codeVal && c.brand === brand);
      if (doc) {
        await errorCodesApi.remove(doc._id);
        setApiCodes(prev => ({
          ...prev,
          [brand]: (prev[brand] || []).filter(c => c.code !== codeVal)
        }));
      }
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  // Merge API codes into ERROR_DB (API takes precedence per brand)
  const mergedDB = dbLoaded ? {
    ...ERROR_DB,
    ...apiCodes
  } : ERROR_DB;
  const [brand, setBrand] = useState("Daikin");
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const errors = useMemo(() => {
    const base = mergedDB[brand] || [];
    return base.filter(e => {
      const matchSearch = !search || e.code.toLowerCase().includes(search.toLowerCase()) || e.meaning.toLowerCase().includes(search.toLowerCase()) || e.fix.toLowerCase().includes(search.toLowerCase());
      const matchSev = sevFilter === "all" || e.severity === sevFilter;
      return matchSearch && matchSev;
    });
  }, [brand, search, sevFilter]);
  const totalErrors = mergedDB[brand]?.length || 0;
  const critCount = mergedDB[brand]?.filter(e => e.severity === "critical").length || 0;
  const highCount = mergedDB[brand]?.filter(e => e.severity === "high").length || 0;
  const brandColor = BRAND_COLOR[brand] || COLORS.brand;
  return <div className="fi ap-ac-error-codes-page-1">

      {/* Header */}
      <div className="ap-ac-error-codes-page-2">
        <div>
          <div className="ap-ac-error-codes-page-3">AC Error Codes</div>
          <div className="ap-ac-error-codes-page-4">
            Complete fault code reference for all major AC brands
          </div>
        </div>
        <div className="ap-ac-error-codes-page-5">
          {BRANDS.length} brands · {Object.values(mergedDB).flat().length}+ codes
        </div>
      </div>

      {/* Brand selector — pill tabs */}
      <div className="ap-ac-error-codes-page-6">
        
        <button onClick={() => setShowAdd(p => !p)} className="ap-ac-error-codes-page-7">+ Add Error Code</button>
        {showAdd && <div className="ap-ac-error-codes-page-8">
            <div className="ap-ac-error-codes-page-9">
              <input placeholder="Error code *" value={addForm.code} onChange={e => setAddForm(f => ({
            ...f,
            code: e.target.value
          }))} className="ap-ac-error-codes-page-10" />
              <select value={addForm.brand} onChange={e => setAddForm(f => ({
            ...f,
            brand: e.target.value
          }))} className="ap-ac-error-codes-page-11">
                {['Daikin', 'Voltas', 'LG', 'Samsung', 'Hitachi', 'Blue Star', 'Other'].map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={addForm.severity} onChange={e => setAddForm(f => ({
            ...f,
            severity: e.target.value
          }))} className="ap-ac-error-codes-page-12">
                {['info', 'warning', 'critical'].map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={addForm.category} onChange={e => setAddForm(f => ({
            ...f,
            category: e.target.value
          }))} className="ap-ac-error-codes-page-13">
                {['Electrical', 'Refrigerant', 'Communication', 'Sensor', 'Mechanical', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <input placeholder="Description *" value={addForm.description} onChange={e => setAddForm(f => ({
          ...f,
          description: e.target.value
        }))} className="ap-ac-error-codes-page-14" />
            <input placeholder="Cause" value={addForm.cause} onChange={e => setAddForm(f => ({
          ...f,
          cause: e.target.value
        }))} className="ap-ac-error-codes-page-15" />
            <input placeholder="Solution / Fix" value={addForm.solution} onChange={e => setAddForm(f => ({
          ...f,
          solution: e.target.value
        }))} className="ap-ac-error-codes-page-16" />
            <div className="ap-ac-error-codes-page-17">
              <button onClick={handleAddCode} disabled={addSaving} className="ap-ac-error-codes-page-18">{addSaving ? 'Saving…' : 'Add Code'}</button>
              <button onClick={() => setShowAdd(false)} className="ap-ac-error-codes-page-19">Cancel</button>
            </div>
          </div>}
<div className="ap-ac-error-codes-page-20">Select Brand</div>
        <div className="ap-ac-error-codes-page-21">
          {BRANDS.map(b => {
          const bc = BRAND_COLOR[b] || "#333";
          const sel = brand === b;
          return <button key={b} onClick={() => {
            setBrand(b);
            setExpanded(null);
            setSearch("");
            setSevFilter("all");
          }} style={{
            border: `2px solid ${sel ? bc : COLORS.border}`,
            background: sel ? bc : COLORS.white,
            color: sel ? "white" : "var(--text-body)",
            boxShadow: sel ? `0 4px 14px ${bc}40` : "none"
          }} className="ap-ac-error-codes-page-22">
                {b}
              </button>;
        })}
        </div>
      </div>

      {/* KPI strip */}
      <div className="ap-ac-error-codes-page-23">
        <div className="ap-ac-error-codes-page-24">
          <div className="ap-ac-error-codes-page-25">Total Codes</div>
          <div style={{
          color: brandColor
        }} className="ap-ac-error-codes-page-26">{totalErrors}</div>
          <div className="ap-ac-error-codes-page-27">{brand} database</div>
        </div>
        <div className="ap-ac-error-codes-page-28">
          <div className="ap-ac-error-codes-page-29">Critical Faults</div>
          <div className="ap-ac-error-codes-page-30">{critCount}</div>
          <div className="ap-ac-error-codes-page-31">require urgent fix</div>
        </div>
        <div className="ap-ac-error-codes-page-32">
          <div className="ap-ac-error-codes-page-33">High Severity</div>
          <div className="ap-ac-error-codes-page-34">{highCount}</div>
          <div className="ap-ac-error-codes-page-35">same-day attention</div>
        </div>
        <div className="ap-ac-error-codes-page-36">
          <div className="ap-ac-error-codes-page-37">Showing</div>
          <div className="ap-ac-error-codes-page-38">{errors.length}</div>
          <div className="ap-ac-error-codes-page-39">filtered results</div>
        </div>
      </div>

      {/* Search + severity filter */}
      <div className="ap-ac-error-codes-page-40">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${brand} error codes, faults, fixes…`} className="ap-ac-error-codes-page-41" />
        <div className="ap-ac-error-codes-page-42">
          {["all", "critical", "high", "medium", "low"].map(s => {
          const sm = SEVERITY_MAP[s] || {
            label: "All",
            color: COLORS.muted,
            bg: COLORS.bg
          };
          const sel = sevFilter === s;
          return <button key={s} onClick={() => setSevFilter(s)} style={{
            background: sel ? sm.bg : COLORS.bg,
            color: sel ? sm.color : COLORS.muted,
            border: `1px solid ${sel ? sm.color + "50" : COLORS.border}`
          }} className="ap-ac-error-codes-page-43">
                {s === "all" ? "All Severity" : sm.label}
              </button>;
        })}
        </div>
      </div>

      {/* Error list */}
      <div className="ap-ac-error-codes-page-44">
        {errors.length === 0 && <div className="ap-ac-error-codes-page-45">
            <div className="ap-ac-error-codes-page-46">🔍</div>
            No error codes match your search.
          </div>}

        {errors.map((err, i) => {
        const sm = SEVERITY_MAP[err.severity] || SEVERITY_MAP.low;
        const isOpen = expanded === `${brand}-${err.code}`;
        return <div key={err.code} onClick={() => setExpanded(isOpen ? null : `${brand}-${err.code}`)} style={{
          border: `1px solid ${isOpen ? brandColor + "60" : COLORS.border}`,
          boxShadow: isOpen ? `0 4px 16px ${brandColor}20` : "0 1px 3px rgba(0,0,0,.04)"
        }} className="ap-ac-error-codes-page-47">

              {/* Row header */}
              <div className="ap-ac-error-codes-page-48">
                {/* Code badge */}
                <div style={{
              background: brandColor
            }} className="ap-ac-error-codes-page-49">
                  {err.code}
                </div>

                {/* Meaning */}
                <div className="ap-ac-error-codes-page-50">
                  <div className="ap-ac-error-codes-page-51">{err.meaning}</div>
                  <div className="ap-ac-error-codes-page-52">
                    {err.cause}
                  </div>
                </div>

                {/* Severity badge */}
                <span style={{
              background: sm.bg,
              color: sm.color
            }} className="ap-ac-error-codes-page-53">
                  {sm.label}
                </span>

                {/* Expand arrow */}
                <span style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
            }} className="ap-ac-error-codes-page-54">▾</span>
              </div>

              {/* Expanded details */}
              {isOpen && <div style={{
            borderTop: `1px solid ${brandColor}25`,
            background: `${brandColor}04`
          }} className="ap-ac-error-codes-page-55">
                  <div className="ap-ac-error-codes-page-56">
                    {[["🔴 Error Code", err.code, brandColor], ["⚠️ Root Cause", err.cause, "#B45309"], ["✅ Recommended Fix", err.fix, "#15803D"]].map(([heading, value, color]) => <div key={heading} className="ap-ac-error-codes-page-57">
                        <div className="ap-ac-error-codes-page-58">{heading}</div>
                        <div style={{
                  color: color
                }} className="ap-ac-error-codes-page-59">{value}</div>
                      </div>)}
                  </div>

                  {/* Quick action buttons */}
                  <div className="ap-ac-error-codes-page-60">
                    <button onClick={e => e.stopPropagation()} className="ap-ac-error-codes-page-61">
                      🔧 Create Repair Job
                    </button>
                    <button onClick={e => e.stopPropagation()} className="ap-ac-error-codes-page-62">
                      📋 Log in Support Ticket
                    </button>
                    <button onClick={e => e.stopPropagation()} className="ap-ac-error-codes-page-63">
                      📄 Add to Job Sheet
                    </button>
                    <div className="ap-ac-error-codes-page-64">
                      <span style={{
                  background: sm.bg,
                  color: sm.color
                }} className="ap-ac-error-codes-page-65">
                        {sm.label} Severity
                      </span>
                    </div>
                  </div>
                </div>}
            </div>;
      })}
      </div>

      {/* Legend */}
      <div className="ap-ac-error-codes-page-66">
        <div className="ap-ac-error-codes-page-67">Severity Guide</div>
        <div className="ap-ac-error-codes-page-68">
          {Object.entries(SEVERITY_MAP).filter(([k]) => k !== "none").map(([k, m]) => <div key={k} className="ap-ac-error-codes-page-69">
              <span style={{
            background: m.color
          }} className="ap-ac-error-codes-page-70" />
              <span style={{
            color: m.color
          }} className="ap-ac-error-codes-page-71">{m.label}</span>
              <span className="ap-ac-error-codes-page-72">—</span>
              <span className="ap-ac-error-codes-page-73">
                {{
              low: "Sensor/temp fault — can schedule",
              medium: "Performance affected — fix soon",
              high: "Unit down — fix same day",
              critical: "Safety risk — fix immediately"
            }[k]}
              </span>
            </div>)}
        </div>
      </div>
    </div>;
};
export default ACErrorCodesPage;