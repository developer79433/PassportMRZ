/**
 * Decode the Machine Readable Zone from a Machine Readable Travel Document (passport).
 * Copyright (C) 2016 Android Developer
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

var MRZ = function(mrzText) {
	this.text = mrzText;
};

MRZ.create = function(mrzText) {
	var match = mrzText.match(/[^a-zA-Z0-9<]/);
	if (match) {
		throw "MRZ contains forbidden character '" + match + "' (" + match[0].charCodeAt(0) + ")";
	}
	if (mrzText.length === 90) {
		return new MRZType1(mrzText);
	} else if (mrzText.length === 88) {
		return new MRZType3(mrzText);
	} else {
		throw "Unrecognised MRZ text (not any of the expected lengths)"
	}
};

MRZ.prototype.getDocumentType = function() {
	var type = this.text.substring(0, 2).replace(/<+$/, '');
	if (type === '') {
		type = undefined;
	}
	return type;
};
MRZ.prototype.getIssuer = function() {
	return this.text.substring(2, 5).replace(/<+$/, '');
};
MRZ.prototype.getIssuerFull = function() {
	var issuer = this.getIssuer();
	if (issuer) {
		issuer = this.countryCodeMap[issuer];
	}
	if (!issuer) {
		issuer = this.countryCodeMap['XXX'];
	}
	return issuer;
};
MRZ.prototype.parseDate = function(startIndex) {
	var year;
	year = parseInt(this.text.substring(startIndex, startIndex + 2), 10);
	// NOTE: The below 'windowing' algorithm may be encumbered by patent.
	// The user should obtain a patent license if one is required.
	if (year < 40) {
		year = 2000 + year;
	} else {
		year = 1900 + year;
	}
	return new Date(
		year,
		parseInt(this.text.substring(startIndex + 2, startIndex + 4), 10) - 1,
		parseInt(this.text.substring(startIndex + 4, startIndex + 6), 10)
	);
};
MRZ.prototype.getBirthDate = function() {
	return this.parseDate(this.birthDateOffset);
};
MRZ.prototype.getSex = function() {
	var sex = this.text.substring(this.sexOffset, this.sexOffset + 1);
	if (sex === '<') {
		sex = undefined;
	}
	return sex;
};
MRZ.prototype.getSexFull = function() {
	var sex = this.text.substring(this.sexOffset, this.sexOffset + 1);
	switch(sex) {
	case 'M':
		sex = "male";
		break;
	case 'F':
		sex =  "female";
		break;
	default:
		sex = "";
		break;
	}
	return sex;
};
MRZ.prototype.getExpiryDate = function() {
	return this.parseDate(this.expiryDateOffset);
};
MRZ.prototype.getNationality = function() {
	return this.text.substring(this.nationalityOffset, this.nationalityOffset + 3).replace(/<+$/, '');
};
MRZ.prototype.getNationalityFull = function() {
	var nationality = this.getNationality();
	if (nationality.length > 0) {
		nationality = this.countryCodeMap[nationality];
	}
	if (!nationality) {
		nationality = this.countryCodeMap['XXX'];
	}
	return nationality;
};
MRZ.prototype.getNameRaw = function() {
	return this.text.substring(this.nameStartOffset, this.nameEndOffset + 1);
};
MRZ.prototype.getName = function() {
	return this.getNameRaw.replace(/<+/g, ' ')
};
MRZ.prototype.getLastName = function() {
	var name = this.getNameRaw();
	var i = name.indexOf('<<');
	if (i !== -1) {
		name = name.substring(0, i);
	}
	name = name.replace(/<+/g, ' ').replace(/ +$/, '');
	return name;
};
MRZ.prototype.getOtherNames = function() {
	var name = this.getNameRaw();
	var i = name.indexOf('<<');
	if (i !== -1) {
		name = name.substring(i + 2, name.length);
	}
	name = name.replace(/<+/g, ' ').replace(/ +$/, '');
	return name;
};
MRZ.prototype.checkSum = function(data, checkDigit) {
	// console.log('Validating "' + data + '" against check digit "' + checkDigit + '"');
	var i, c, weightings = [ 7, 3, 1 ], weightingIndex = 0, sum = 0;
	for (i = 0; i < data.length; i++) {
		c = data.substring(i, i + 1);
		if (c === '<') {
			c = 0;
		} else if ('0'.charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= '9'.charCodeAt(0)) {
			c = c.charCodeAt(0) - '0'.charCodeAt(0);
		} else {
			c = c.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 10;
		}
		c *= weightings[weightingIndex++];
		if (weightingIndex >= weightings.length) {
			weightingIndex = 0;
		}
		sum += c;
	}
	sum = sum % 10;
	if (sum != checkDigit.charCodeAt(0) - '0'.charCodeAt(0)) {
		throw 'Check digit "' + checkDigit + '" does not match data "' + data + '": should be "' + sum + '"';
	}
};
MRZ.prototype.getDocumentNumber = function() {
	return this.text.substring(this.documentNumberStartOffset, this.documentNumberEndOffset + 1).replace(/<+$/, '');
};
MRZ.prototype.type = undefined;
MRZ.prototype.getType = function() {
	return this.type;
};
MRZ.prototype.getTypeFull = function() {
	return "Type " + this.getType();
};

var MRZType1 = function(mrzText) {
	MRZ.apply(this, arguments);
	if (this.text.length !== 90) {
		throw "Type 1 MRZ must be 90 characters long";
	}
	this.checkSum(this.text.substring(5, 14), this.text.substring(14, 15));
	this.checkSum(this.text.substring(30, 36), this.text.substring(36, 37));
	this.checkSum(this.text.substring(38, 44), this.text.substring(44, 45));
	this.checkSum(
		this.text.substring(5, 30) +
		this.text.substring(30, 37) +
		this.text.substring(38, 45) +
		this.text.substring(48, 59),
		this.text.substring(59, 60)
	);
};

MRZType1.prototype = new MRZ();

MRZType1.prototype.birthDateOffset = 30;
MRZType1.prototype.sexOffset = 37;
MRZType1.prototype.expiryDateOffset = 38;
MRZType1.prototype.nationalityOffset = 45;
MRZType1.prototype.nameStartOffset = 60;
MRZType1.prototype.nameEndOffset = 89;
MRZType1.prototype.documentNumberStartOffset = 5;
MRZType1.prototype.documentNumberEndOffset = 13;
MRZType1.prototype.getType = function() {
	return 1;
};

var MRZType3 = function(mrzText) {
	MRZ.apply(this, arguments);
	if (this.text.length !== 88) {
		throw "Type 3 MRZ must be 88 characters long";
	}
	// Check passport number check digit
	this.checkSum(this.text.substring(44, 53), this.text.substring(53, 54));
	// Check birth date check digit
	this.checkSum(this.text.substring(57, 63), this.text.substring(63, 64));
	// Check expiry date check digit
	this.checkSum(this.text.substring(65, 71), this.text.substring(71, 72));
	// Optionally, check personal number check digit
	if (this.getPersonalNumber() !== '') {
		this.checkSum(this.text.substring(72, 86), this.text.substring(86, 87));
	}
	// Check final check digit
	this.checkSum(
		this.text.substring(44, 54) +
		this.text.substring(57, 64) +
		this.text.substring(65, 87),
		this.text.substring(87, 88)
	);
};

MRZType3.prototype = new MRZ();

MRZType3.prototype.birthDateOffset = 57;
MRZType3.prototype.sexOffset = 64;
MRZType3.prototype.expiryDateOffset = 65;
MRZType3.prototype.nationalityOffset = 54;
MRZType3.prototype.nameStartOffset = 5;
MRZType3.prototype.nameEndOffset = 43;
MRZType3.prototype.documentNumberStartOffset = 44;
MRZType3.prototype.documentNumberEndOffset = 52;
MRZType3.prototype.getType = function() {
	return 3;
};
MRZType3.prototype.getPersonalNumber = function() {
	return this.text.substring(72, 82).replace(/<+$/, '');
};

MRZ.prototype.countryCodeMap = {
	"AFG": "Afghanistan",
	"ALB": "Albania",
	"DZA": "Algeria",
	"ASM": "American Samoa",
	"AND": "Andorra",
	"AGO": "Angola",
	"AIA": "Anguilla",
	"ATA": "Antarctica",
	"ATG": "Antigua and Barbuda",
	"ARG": "Argentina",
	"ARM": "Armenia",
	"ABW": "Aruba",
	"AUS": "Australia",
	"AUT": "Austria",
	"AZE": "Azerbaijan",
	"BHS": "Bahamas",
	"BHR": "Bahrain",
	"BGD": "Bangladesh",
	"BRB": "Barbados",
	"BLR": "Belarus",
	"BEL": "Belgium",
	"BLZ": "Belize",
	"BEN": "Benin",
	"BMU": "Bermuda",
	"BTN": "Bhutan",
	"BOL": "Bolivia",
	"BIH": "Bosnia and Herzegovina",
	"BWA": "Botswana",
	"BVT": "Bouvet Island",
	"BRA": "Brazil",
	"IOT": "British Indian Ocean Territory",
	"BRN": "Brunei Darussalam",
	"BGR": "Bulgaria",
	"BFA": "Burkina Faso",
	"BDI": "Burundi",
	"KHM": "Cambodia",
	"CMR": "Cameroon",
	"CAN": "Canada",
	"CPV": "Cape Verde",
	"CYM": "Cayman Islands",
	"CAF": "Central African Republic",
	"TCD": "Chad",
	"CHL": "Chile",
	"CHN": "China",
	"CXR": "Christmas Island",
	"CCK": "Cocos (Keeling) Islands",
	"COL": "Colombia",
	"COM": "Comoros",
	"COG": "Congo",
	"COK": "Cook Islands",
	"CRI": "Costa Rica",
	"CIV": "Côte d'Ivoire",
	"HRV": "Croatia",
	"CUB": "Cuba",
	"CYP": "Cyprus",
	"CZE": "Czech Republic",
	"PRK": "Democratic People's Republic of Korea",
	"COD": "Democratic Republic of the Congo",
	"DNK": "Denmark",
	"DJI": "Djibouti",
	"DMA": "Dominica",
	"DOM": "Dominican Republic",
	"TMP": "East Timor",
	"ECU": "Ecuador",
	"EGY": "Egypt",
	"SLV": "El Salvador",
	"GNQ": "Equatorial Guinea",
	"ERI": "Eritrea",
	"EST": "Estonia",
	"ETH": "Ethiopia",
	"FLK": "Falkland Islands (Malvinas)",
	"FRO": "Faeroe Islands",
	"FJI": "Fiji",
	"FIN": "Finland",
	"FRA": "France",
	"FXX": "France, Metropolitan",
	"GUF": "French Guiana",
	"PYF": "French Polynesia",
	"GAB": "Gabon",
	"GMB": "Gambia",
	"GEO": "Georgia",
	"D": "Germany",
	"GHA": "Ghana",
	"GIB": "Gibraltar",
	"GRC": "Greece",
	"GRL": "Greenland",
	"GRD": "Grenada",
	"GLP": "Guadeloupe",
	"GUM": "Guam",
	"GTM": "Guatemala",
	"GIN": "Guinea",
	"GNB": "Guinea-Bissau",
	"GUY": "Guyana",
	"HTI": "Haiti",
	"HMD": "Heard and McDonald Islands",
	"VAT": "Holy See (Vatican City State)",
	"HND": "Honduras",
	"HKG": "Hong Kong",
	"HUN": "Hungary",
	"ISL": "Iceland",
	"IND": "India",
	"IDN": "Indonesia",
	"IRN": "Iran, Islamic Republic of",
	"IRQ": "Iraq",
	"IRL": "Ireland",
	"ISR": "Israel",
	"ITA": "Italy",
	"JAM": "Jamaica",
	"JPN": "Japan",
	"JOR": "Jordan",
	"KAZ": "Kazakhstan",
	"KEN": "Kenya",
	"KIR": "Kiribati",
	"KWT": "Kuwait",
	"KGZ": "Kyrgyzstan",
	"LAO": "Lao People's Democratic Republic",
	"LVA": "Latvia",
	"LBN": "Lebanon",
	"LSO": "Lesotho",
	"LBR": "Liberia",
	"LBY": "Libyan Arab Jamahiriya",
	"LIE": "Liechtenstein",
	"LTU": "Lithuania",
	"LUX": "Luxembourg",
	"MDG": "Madagascar",
	"MWI": "Malawi",
	"MYS": "Malaysia",
	"MDV": "Maldives",
	"MLI": "Mali",
	"MLT": "Malta",
	"MHL": "Marshall Islands",
	"MTQ": "Martinique",
	"MRT": "Mauritania",
	"MUS": "Mauritius",
	"MYT": "Mayotte",
	"MEX": "Mexico",
	"FSM": "Micronesia, Federated States of",
	"MCO": "Monaco",
	"MNG": "Mongolia",
	"MSR": "Montserrat",
	"MAR": "Morocco",
	"MOZ": "Mozambique",
	"MMR": "Myanmar",
	"NAM": "Namibia",
	"NRU": "Nauru",
	"NPL": "Nepal",
	"NLD": "Netherlands, Kingdom of the",
	"ANT": "Netherlands Antilles",
	"NTZ": "Neutral Zone",
	"NCL": "New Caledonia",
	"NZL": "New Zealand",
	"NIC": "Nicaragua",
	"NER": "Niger",
	"NGA": "Nigeria",
	"NIU": "Niue",
	"NFK": "Norfolk Island",
	"MNP": "Northern Mariana Islands",
	"NOR": "Norway",
	"OMN": "Oman",
	"PAK": "Pakistan",
	"PLW": "Palau",
	"PAN": "Panama",
	"PNG": "Papua New Guinea",
	"PRY": "Paraguay",
	"PER": "Peru",
	"PHL": "Philippines",
	"PCN": "Pitcairn",
	"POL": "Poland",
	"PRT": "Portugal",
	"PRI": "Puerto Rico",
	"QAT": "Qatar",
	"KOR": "Republic of Korea",
	"MDA": "Republic of Moldova",
	"REU": "Réunion",
	"ROM": "Romania",
	"RUS": "Russian Federation",
	"RWA": "Rwanda",
	"SHN": "Saint Helena",
	"KNA": "Saint Kitts and Nevis",
	"LCA": "Saint Lucia",
	"SPM": "Saint Pierre and Miquelon",
	"VCT": "Saint Vincent and the Grenadines",
	"WSM": "Samoa",
	"SMR": "San Marino",
	"STP": "Sao Tome and Principe",
	"SAU": "Saudi Arabia",
	"SEN": "Senegal",
	"SYC": "Seychelles",
	"SLE": "Sierra Leone",
	"SGP": "Singapore",
	"SVK": "Slovakia",
	"SVN": "Slovenia",
	"SLB": "Solomon Islands",
	"SOM": "Somalia",
	"ZAF": "South Africa",
	"SGS": "South Georgia and the South Sandwich Island",
	"ESP": "Spain",
	"LKA": "Sri Lanka",
	"SDN": "Sudan",
	"SUR": "Suriname",
	"SJM": "Svalbard and Jan Mayen Islands",
	"SWZ": "Swaziland",
	"SWE": "Sweden",
	"CHE": "Switzerland",
	"SYR": "Syrian Arab Republic",
	"TWN": "Taiwan Province of China",
	"TJK": "Tajikistan",
	"THA": "Thailand",
	"MKD": "The former Yugoslav Republic of Macedonia",
	"TGO": "Togo",
	"TKL": "Tokelau",
	"TON": "Tonga",
	"TTO": "Trinidad and Tobago",
	"TUN": "Tunisia",
	"TUR": "Turkey",
	"TKM": "Turkmenistan",
	"TCA": "Turks and Caicos Islands",
	"TUV": "Tuvalu",
	"UGA": "Uganda",
	"UKR": "Ukraine",
	"ARE": "United Arab Emirates",
	"GBR": "United Kingdom of Great Britain and Northern Ireland - Citizen",
	"GBD": "United Kingdom of Great Britain and Northern Ireland - Dependent territories citizen",
	"GBN": "United Kingdom of Great Britain and Northern Ireland - National (overseas)",
	"GBO": "United Kingdom of Great Britain and Northern Ireland - Overseas citizen",
	"GBP": "United Kingdom of Great Britain and Northern Ireland - Protected Person",
	"GBS": "United Kingdom of Great Britain and Northern Ireland - Subject",
	"TZA": "United Republic of Tanzania",
	"USA": "United States of America",
	"UMI": "United States of America Minor Outlying Islands",
	"URY": "Uruguay",
	"UZB": "Uzbekistan",
	"VUT": "Vanuatu",
	"VEN": "Venezuela",
	"VNM": "Viet Nam",
	"VGB": "Virgin Islands (Great Britain)",
	"VIR": "Virgin Islands (United States)",
	"WLF": "Wallis and Futuna Islands",
	"ESH": "Western Sahara",
	"YEM": "Yemen",
	"ZAR": "Zaire",
	"ZMB": "Zambia",
	"ZWE": "Zimbabwe",
	"UNO": "United Nations Organization",
	"UNA": "United Nations specialized agency official",
	"WSA": "World Service Authority World Passport",
	"XCC": "Caribbean Community",
	"XOM": "Sovereign Military Order of Malta",
	"XXA": "Stateless",
	"XXB": "Refugee",
	"XXC": "Refugee (non-convention)",
	"XXX": "Unspecified / Unknown"
};

var assert = console.assert;

var test_input_type1 =
	"IDBEL590335801485120100200<<<<" +
	"8512017F0901015BEL<<<<<<<<<<<7" +
	"REINARTZ<<ULRIKE<KATIA<E<<<<<<";
var test_input_type3 =
	"P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<" +
	"L898902C<3UTO6908061F9406236ZE184226B<<<<<14";

function runTests() {
	var mrz1, mrz3;

	mrz1 = MRZ.create(test_input_type1);
	assert(mrz1.getDocumentType() === "ID");
	assert(mrz1.getIssuer() == "BEL");
	assert(mrz1.getBirthDate().getDate() === 1);
	assert(mrz1.getBirthDate().getMonth() === 11);
	assert(mrz1.getBirthDate().getFullYear() === 1985);
	assert(mrz1.getExpiryDate().getDate() == 1);
	assert(mrz1.getExpiryDate().getMonth() === 0);
	assert(mrz1.getExpiryDate().getFullYear() === 2009);
	assert(mrz1.getSexFull() === "female");
	assert(mrz1.getNationalityFull() === "Belgium");
	assert(mrz1.getLastName() === "REINARTZ");
	assert(mrz1.getOtherNames() === "ULRIKE KATIA E");
	assert(mrz1.getDocumentNumber() === "590335801");

	mrz3 = MRZ.create(test_input_type3);
	assert(mrz3.getDocumentType() === "P");
	assert(mrz3.getIssuer() == "UTO");
	assert(mrz3.getBirthDate().getDate() == 6);
	assert(mrz3.getBirthDate().getMonth() === 7);
	assert(mrz3.getBirthDate().getFullYear() === 1969);
	assert(mrz3.getExpiryDate().getDate() == 23);
	assert(mrz3.getExpiryDate().getMonth() === 5);
	assert(mrz3.getExpiryDate().getFullYear() === 1994);
	assert(mrz3.getSexFull() === "female");
	assert(mrz3.getNationalityFull() === "Unspecified / Unknown");
	assert(mrz3.getLastName() === "ERIKSSON");
	assert(mrz3.getOtherNames() === "ANNA MARIA");
	assert(mrz3.getDocumentNumber() === "L898902C");
	assert(mrz3.getPersonalNumber() === "ZE184226B");
}
// runTests();
