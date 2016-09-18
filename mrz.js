/**
 * Decode the Machine Readable Zone from a
 * Machine Readable Travel Document (passport).
 */

var MRZ = function(mrzText) {
	this.text = mrzText;
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

MRZ.prototype.getPassport = function() {
	return this.text.substring(0, 1);
};
MRZ.prototype.getPassportType = function() {
	var type = this.text.substring(1, 2);
	if (type === '<') {
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
MRZ.prototype.getName = function() {
	return this.text.substring(5, 44).replace(/<+/g, ' ')
};
MRZ.prototype.getLastName = function() {
	var name = this.text.substring(5, 44);
	var i = name.indexOf('<<');
	if (i !== -1) {
		name = name.substring(0, i);
	}
	name = name.replace(/<+/g, ' ');
	return name;
};
MRZ.prototype.getOtherNames = function() {
	var name = this.text.substring(5, 44);
	var i = name.indexOf('<<');
	if (i !== -1) {
		name = name.substring(i + 2, name.length);
	}
	name = name.replace(/<+/g, ' ');
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
MRZ.prototype.getPassportNumber = function() {
	return this.text.substring(44, 53).replace(/<+$/, '');
};
MRZ.prototype.getNationality = function() {
	return this.text.substring(54, 57).replace(/<+$/, '');
};
MRZ.prototype.getNationalityFull = function() {
	var nationality = this.getNationality();
	if (nationality) {
		nationality = this.countryCodeMap[nationality];
	}
	if (!nationality) {
		nationality = this.countryCodeMap['XXX'];
	}
	return nationality;
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
	return this.parseDate(57);
};
MRZ.prototype.getSex = function() {
	var sex = this.text.substring(64, 65);
	if (sex === '<') {
		sex = undefined;
	}
	return sex;
};
MRZ.prototype.getSexFull = function() {
	var sex = this.text.substring(64, 65);
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
	return this.parseDate(65);
};
MRZ.prototype.getPersonalNumber = function() {
	return this.text.substring(72, 82).replace(/<+$/, '');
};
MRZ.prototype.countryCodeMap = {
	"AFG": "Afghanistan ",
	"ALB": "Albania ",
	"DZA": "Algeria ",
	"ASM": "American Samoa ",
	"AND": "Andorra ",
	"AGO": "Angola ",
	"AIA": "Anguilla ",
	"ATA": "Antarctica ",
	"ATG": "Antigua and Barbuda ",
	"ARG": "Argentina ",
	"ARM": "Armenia ",
	"ABW": "Aruba ",
	"AUS": "Australia ",
	"AUT": "Austria ",
	"AZE": "Azerbaijan ",
	"BHS": "Bahamas ",
	"BHR": "Bahrain ",
	"BGD": "Bangladesh ",
	"BRB": "Barbados ",
	"BLR": "Belarus ",
	"BEL": "Belgium ",
	"BLZ": "Belize ",
	"BEN": "Benin ",
	"BMU": "Bermuda ",
	"BTN": "Bhutan ",
	"BOL": "Bolivia ",
	"BIH": "Bosnia and Herzegovina ",
	"BWA": "Botswana ",
	"BVT": "Bouvet Island ",
	"BRA": "Brazil ",
	"IOT": "British Indian Ocean Territory ",
	"BRN": "Brunei Darussalam ",
	"BGR": "Bulgaria ",
	"BFA": "Burkina Faso ",
	"BDI": "Burundi ",
	"KHM": "Cambodia ",
	"CMR": "Cameroon ",
	"CAN": "Canada ",
	"CPV": "Cape Verde ",
	"CYM": "Cayman Islands ",
	"CAF": "Central African Republic ",
	"TCD": "Chad ",
	"CHL": "Chile ",
	"CHN": "China ",
	"CXR": "Christmas Island ",
	"CCK": "Cocos (Keeling) Islands ",
	"COL": "Colombia ",
	"COM": "Comoros ",
	"COG": "Congo ",
	"COK": "Cook Islands ",
	"CRI": "Costa Rica ",
	"CIV": "Côte d'Ivoire ",
	"HRV": "Croatia ",
	"CUB": "Cuba ",
	"CYP": "Cyprus ",
	"CZE": "Czech Republic ",
	"PRK": "Democratic People's Republic of Korea ",
	"COD": "Democratic Republic of the Congo ",
	"DNK": "Denmark ",
	"DJI": "Djibouti ",
	"DMA": "Dominica ",
	"DOM": "Dominican Republic ",
	"TMP": "East Timor ",
	"ECU": "Ecuador ",
	"EGY": "Egypt ",
	"SLV": "El Salvador ",
	"GNQ": "Equatorial Guinea ",
	"ERI": "Eritrea ",
	"EST": "Estonia ",
	"ETH": "Ethiopia ",
	"FLK": "Falkland Islands (Malvinas) ",
	"FRO": "Faeroe Islands ",
	"FJI": "Fiji ",
	"FIN": "Finland ",
	"FRA": "France ",
	"FXX": "France, Metropolitan ",
	"GUF": "French Guiana ",
	"PYF": "French Polynesia ",
	"GAB": "Gabon ",
	"GMB": "Gambia ",
	"GEO": "Georgia ",
	"D": "Germany ",
	"GHA": "Ghana ",
	"GIB": "Gibraltar ",
	"GRC": "Greece ",
	"GRL": "Greenland ",
	"GRD": "Grenada ",
	"GLP": "Guadeloupe ",
	"GUM": "Guam ",
	"GTM": "Guatemala ",
	"GIN": "Guinea ",
	"GNB": "Guinea-Bissau ",
	"GUY": "Guyana ",
	"HTI": "Haiti ",
	"HMD": "Heard and McDonald Islands ",
	"VAT": "Holy See (Vatican City State) ",
	"HND": "Honduras ",
	"HKG": "Hong Kong ",
	"HUN": "Hungary ",
	"ISL": "Iceland ",
	"IND": "India ",
	"IDN": "Indonesia ",
	"IRN": "Iran, Islamic Republic of ",
	"IRQ": "Iraq ",
	"IRL": "Ireland ",
	"ISR": "Israel ",
	"ITA": "Italy ",
	"JAM": "Jamaica ",
	"JPN": "Japan ",
	"JOR": "Jordan ",
	"KAZ": "Kazakhstan ",
	"KEN": "Kenya ",
	"KIR": "Kiribati ",
	"KWT": "Kuwait ",
	"KGZ": "Kyrgyzstan ",
	"LAO": "Lao People's Democratic Republic ",
	"LVA": "Latvia ",
	"LBN": "Lebanon ",
	"LSO": "Lesotho ",
	"LBR": "Liberia ",
	"LBY": "Libyan Arab Jamahiriya ",
	"LIE": "Liechtenstein ",
	"LTU": "Lithuania ",
	"LUX": "Luxembourg ",
	"MDG": "Madagascar ",
	"MWI": "Malawi ",
	"MYS": "Malaysia ",
	"MDV": "Maldives ",
	"MLI": "Mali ",
	"MLT": "Malta ",
	"MHL": "Marshall Islands ",
	"MTQ": "Martinique ",
	"MRT": "Mauritania ",
	"MUS": "Mauritius ",
	"MYT": "Mayotte ",
	"MEX": "Mexico ",
	"FSM": "Micronesia, Federated States of ",
	"MCO": "Monaco ",
	"MNG": "Mongolia ",
	"MSR": "Montserrat ",
	"MAR": "Morocco ",
	"MOZ": "Mozambique ",
	"MMR": "Myanmar ",
	"NAM": "Namibia ",
	"NRU": "Nauru ",
	"NPL": "Nepal ",
	"NLD": "Netherlands, Kingdom of the ",
	"ANT": "Netherlands Antilles ",
	"NTZ": "Neutral Zone ",
	"NCL": "New Caledonia ",
	"NZL": "New Zealand ",
	"NIC": "Nicaragua ",
	"NER": "Niger ",
	"NGA": "Nigeria ",
	"NIU": "Niue ",
	"NFK": "Norfolk Island ",
	"MNP": "Northern Mariana Islands ",
	"NOR": "Norway ",
	"OMN": "Oman ",
	"PAK": "Pakistan ",
	"PLW": "Palau ",
	"PAN": "Panama ",
	"PNG": "Papua New Guinea ",
	"PRY": "Paraguay ",
	"PER": "Peru ",
	"PHL": "Philippines ",
	"PCN": "Pitcairn ",
	"POL": "Poland ",
	"PRT": "Portugal ",
	"PRI": "Puerto Rico ",
	"QAT": "Qatar ",
	"KOR": "Republic of Korea ",
	"MDA": "Republic of Moldova ",
	"REU": "Réunion ",
	"ROM": "Romania ",
	"RUS": "Russian Federation ",
	"RWA": "Rwanda ",
	"SHN": "Saint Helena ",
	"KNA": "Saint Kitts and Nevis ",
	"LCA": "Saint Lucia ",
	"SPM": "Saint Pierre and Miquelon ",
	"VCT": "Saint Vincent and the Grenadines ",
	"WSM": "Samoa ",
	"SMR": "San Marino ",
	"STP": "Sao Tome and Principe ",
	"SAU": "Saudi Arabia ",
	"SEN": "Senegal ",
	"SYC": "Seychelles ",
	"SLE": "Sierra Leone ",
	"SGP": "Singapore ",
	"SVK": "Slovakia ",
	"SVN": "Slovenia ",
	"SLB": "Solomon Islands ",
	"SOM": "Somalia ",
	"ZAF": "South Africa ",
	"SGS": "South Georgia and the South Sandwich Island ",
	"ESP": "Spain ",
	"LKA": "Sri Lanka ",
	"SDN": "Sudan ",
	"SUR": "Suriname ",
	"SJM": "Svalbard and Jan Mayen Islands ",
	"SWZ": "Swaziland ",
	"SWE": "Sweden ",
	"CHE": "Switzerland ",
	"SYR": "Syrian Arab Republic ",
	"TWN": "Taiwan Province of China ",
	"TJK": "Tajikistan ",
	"THA": "Thailand ",
	"MKD": "The former Yugoslav Republic of Macedonia ",
	"TGO": "Togo ",
	"TKL": "Tokelau ",
	"TON": "Tonga ",
	"TTO": "Trinidad and Tobago ",
	"TUN": "Tunisia ",
	"TUR": "Turkey ",
	"TKM": "Turkmenistan ",
	"TCA": "Turks and Caicos Islands ",
	"TUV": "Tuvalu ",
	"UGA": "Uganda ",
	"UKR": "Ukraine ",
	"ARE": "United Arab Emirates ",
	"GBR": "United Kingdom of Great Britain and Northern Ireland - Citizen ",
	"GBD": "United Kingdom of Great Britain and Northern Ireland - Dependent territories citizen ",
	"GBN": "United Kingdom of Great Britain and Northern Ireland - National (overseas) ",
	"GBO": "United Kingdom of Great Britain and Northern Ireland - Overseas citizen ",
	"GBP": "United Kingdom of Great Britain and Northern Ireland - Protected Person ",
	"GBS": "United Kingdom of Great Britain and Northern Ireland - Subject ",
	"TZA": "United Republic of Tanzania ",
	"USA": "United States of America ",
	"UMI": "United States of America Minor Outlying Islands ",
	"URY": "Uruguay ",
	"UZB": "Uzbekistan ",
	"VUT": "Vanuatu ",
	"VEN": "Venezuela ",
	"VNM": "Viet Nam ",
	"VGB": "Virgin Islands (Great Britian) ",
	"VIR": "Virgin Islands (United States) ",
	"WLF": "Wallis and Futuna Islands ",
	"ESH": "Western Sahara ",
	"YEM": "Yemen ",
	"ZAR": "Zaire ",
	"ZMB": "Zambia ",
	"ZWE": "Zimbabwe ",
	"UNO": "United Nations Organization",
	"UNA": "United Nations specialized agency official ",
	"XXA": "Stateless ",
	"XXB": "Refugee",
	"XXC": "Refugee (non-convention) ",
	"XXX": "Unspecified / Unknown "
};
