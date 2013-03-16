exports = module.exports;
exports.START_BYTE = 0x7E;
exports.ESCAPE = 0x7D;
exports.XOFF = 0x13;
exports.XON = 0x11;
exports.EVT_SEP = "_";
exports.MAX_PAYLOAD_SIZE = 74;

var ft = exports.FRAME_TYPE = {};
var diss = exports.DISCOVERY_STATUS = {};
var dels = exports.DELIVERY_STATUS = {};
var coms = exports.COMMAND_STATUS = {};
var ms = exports.MODEM_STATUS = {};
var ro = exports.RECEIVE_OPTIONS = {};
var dt = exports.DEVICE_TYPES = {};

var dc = exports.DIGITAL_CHANNELS = {};
var ac = exports.ANALOG_CHANNELS = {};

// Device Type
dt.COORDINATOR = 0x00;
dt[0x00] = "COORDINATOR";
dt.ROUTER = 0x01;
dt[0x01] = "ROUTER";
dt.END_DEVICE = 0x02;
dt[0x02] = "END_DEVICE";

// Frame Type
ft.AT_COMMAND = 0x08;
ft[0x08] = "AT Command (0x08)";
ft.AT_COMMAND_QUEUE_PARAMETER_VALUE = 0x09;
ft[0x09] = "AT Command - Queue Parameter Value (0x09)";
ft.ZIGBEE_TRANSMIT_REQUEST = 0x10;
ft[0x10] = "ZigBee Transmit Request (0x10)";
ft.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME = 0x11;
ft[0x11] = "Explicit Addressing ZigBee Command Frame (0x11)";
ft.REMOTE_COMMAND_REQUEST = 0x17;
ft[0x17] = "Remote Command Request (0x17)";
ft.CREATE_SOURCE_ROUTE = 0x21;
ft[0x21] = "Create Source Route (0x21)";
ft.AT_COMMAND_RESPONSE = 0x88;
ft[0x88] = "AT Command Response (0x88)";
ft.MODEM_STATUS = 0x8A;
ft[0x8A] = "Modem Status (0x8A)";
ft.ZIGBEE_TRANSMIT_STATUS = 0x8B;
ft[0x8B] = "ZigBee Transmit Status (0x8B)";
ft.ZIGBEE_RECEIVE_PACKET = 0x90;
ft[0x90] = "ZigBee Receive Packet (AO=0) (0x90)";
ft.ZIGBEE_EXPLICIT_RX = 0x91;
ft[0x91] = "ZigBee Explicit Rx Indicator (AO=1) (0x91)";
ft.ZIGBEE_IO_DATA_SAMPLE_RX = 0x92;
ft[0x92] = "ZigBee IO Data Sample Rx Indicator (0x92)";
ft.XBEE_SENSOR_READ = 0x94;
ft[0x94] = "XBee Sensor Read Indicator (AO=0) (0x94)";
ft.NODE_IDENTIFICATION = 0x95;
ft[0x95] = "Node Identification Indicator (AO=0) (0x95)";
ft.REMOTE_COMMAND_RESPONSE = 0x97;
ft[0x97] = "Remote Command Response (0x97)";
ft.OTA_FIRMWARE_UPDATE_STATUS = 0xA0;
ft[0xA0] = "Over-the-Air Firmware Update Status (0xA0)";
ft.ROUTE_RECORD = 0xA1;
ft[0xA1] = "Route Record Indicator (0xA1)";
ft.MTO_ROUTE_REQUEST = 0xA3;
ft[0xA3] = "Many-to-One Route Request Indicator (0xA3)";

// Modem Status
ms.HARDWARE_RESET = 0x00;
ms[0x00] = "Hardware Reset";
ms.WATCHDOG_RESET = 0x01;
ms[0x01] = "Watchdog timer reset";
ms.JOINED_NETWORK = 0x02;
ms[0x02] = "Joined network";
ms.DISASSOCIATED = 0x03;
ms[0x03] = "Disassociated";
ms.COORDINATOR_STARTED = 0x06;
ms[0x06] = "Coordinator started";
ms.SECURITY_KEY_UPDATED = 0x07;
ms[0x07] = "Network security key was updated";
ms.VOLTAGE_SUPPLY_LIMIT_EXCEEDED = 0x0D;
ms[0x0D] = "Voltage supply limit exceeded";
ms.CONFIGURATION_CHANGED_DURING_JOIN = 0x11;
ms[0x11] = "Modem Configuration changed while join in progress";
ms.STACK_ERROR = 0x80;
ms[0x80] = "Stack Error";

// Command Status
coms.OK = 0x00;
coms[0x00] = "OK (0x00)";
coms.ERROR = 0x01;
coms[0x01] = "ERROR (0x01)";
coms.INVALID_COMMAND = 0x02;
coms[0x02] = "Invalid Command (0x02)";
coms.INVALID_PARAMETER = 0x03;
coms[0x03] = "Invalid Command (0x03)";
coms.REMOTE_CMD_TRANS_FAILURE = 0x04;
coms[0x04] = "Remote Command Transmission Failed (0x04)";

// Delivery Status
dels.SUCCESS = 0x00;
dels[0x00] = "Success (0x00)";
dels.MAC_ACK_FALIURE = 0x01;
dels[0x01] = "MAC ACK Failure (0x01)";
dels.CA_FAILURE = 0x02;
dels[0x02] = "CA Failure (0x02)";
dels.INVALID_DESTINATION_ENDPOINT = 0x15;
dels[0x15] = "Invalid destination endpoint (0x15)";
dels.NETWORK_ACK_FAILURE = 0x21;
dels[0x21] = "Network ACK Failure (0x21)";
dels.NOT_JOINED_TO_NETWORK = 0x22;
dels[0x22] = "Not Joined to Network (0x22)";
dels.SELF_ADDRESSED = 0x23;
dels[0x23] = "Self-addressed (0x23)";
dels.ADDRESS_NOT_FOUND = 0x24;
dels[0x24] = "Address Not Found (0x24)";
dels.ROUTE_NOT_FOUND = 0x25;
dels[0x25] = "Route Not Found (0x25)";
dels.BROADCAST_SOURCE_FAILED = 0x26;
dels[0x26] = "Broadcast source failed to hear a neighbor relay the message (0x26)";
dels.INVALID_BINDING_TABLE_INDEX = 0x2B;
dels[0x2B] = "Invalid binding table index (0x2B)";
dels.RESOURCE_ERROR = 0x2C;
dels[0x2C] = "Resource error lack of free buffers, timers, etc. (0x2C)";
dels.ATTEMPTED_BROADCAST_WITH_APS_TRANS = 0x2D;
dels[0x2D] = "Attempted broadcast with APS transmission (0x2D)";
dels.ATTEMPTED_BROADCAST_WITH_APS_TRANS_EE0 = 0x2D;
dels[0x2E] = "Attempted unicast with APS transmission, but EE=0 (0x2E)";
dels.RESOURCE_ERROR_B = 0x32;
dels[0x32] = "Resource error lack of free buffers, timers, etc. (0x32)";
dels.DATA_PAYLOAD_TOO_LARGE = 0x74;
dels[0x74] = "Data payload too large (0x74)";
dels.INDIRECT_MESSAGE_UNREQUESTED = 0x75;
dels[0x75] = "Indirect message unrequested (0x75)";

// Discovery Status
diss.NO_DISCOVERY_OVERHEAD = 0x00;
diss[0x00] = "No Discovery Overhead (0x00)";
diss.ADDRESS_DISCOVERY = 0x01;
diss[0x01] = "Address Discovery (0x01)";
diss.ROUTE_DISCOVERY = 0x02;
diss[0x02] = "Route Discovery (0x02)";
diss.ADDRESS_AND_ROUTE_DISCOVERY = 0x03;
diss[0x03] = "Address and Route (0x03)";
diss.EXTENDED_TIMEOUT_DISCOVERY = 0x40;
diss[0x40] = "Extended Timeout Discovery (0x40)";

// Receive Options
ro.PACKET_ACKNOWLEDGED = 0x01;
ro[0x01] = "Packet Acknowledged (0x01)";
ro.PACKET_WAS_BROADCAST = 0x02;
ro[0x02] = "Packet was a broadcast packet (0x02)";
ro.PACKET_ENCRYPTED = 0x20;
ro[0x20] = "Packet encrypted with APS encryption (0x20)";
ro.PACKET_SENT_FROM_END_DEVICE = 0x40;
ro[0x40] = "Packet was sent from an end device (if known) (0x40)";

dc[0]  = "DIO0";  // AD0
dc[1]  = "DIO1";  // AD1
dc[2]  = "DIO2";  // AD2
dc[3]  = "DIO3";  // AD3
dc[4]  = "DIO4";  // -
dc[5]  = "DIO5";  // ASSOC
dc[6]  = "DIO6";  // RTS
dc[7]  = "GPIO7"; // CTS
dc[10] = "DIO10"; // RSSI
dc[11] = "DIO11"; // PWM
dc[12] = "DIO12"; // CD

ac[0] = "AD0";  // DIO0
ac[1] = "AD1";  // DIO1
ac[2] = "AD2";  // DIO2
ac[3] = "AD3";  // DIO3
ac[7] = "SUPPLY";
