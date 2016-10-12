/**
 * Test harness for passport MRZ parser.
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

function parseMRZ() {
	var mrz, input = $("#mrz"), mrzText = input.val().replace(/[ \t\r\n]+/g, '');
	try {
		console.log(mrzText);
		mrz = MRZ.create(mrzText);
	} catch (e) {
		console.log(e);
		$('.message').text(e);
		return;
	}
	$('.message').text("Valid MRZ " + mrz.getTypeFull());
	$('#documentType').text(mrz.getDocumentType());
	$('#issuer').text(mrz.getIssuerFull());
	$('#lastName').text(mrz.getLastName());
	$('#otherNames').text(mrz.getOtherNames());
	$('#documentNumber').text(mrz.getDocumentNumber());
	$('#nationality').text(mrz.getNationalityFull());
	$('#birthDate').text(mrz.getBirthDate());
	$('#sex').text(mrz.getSexFull());
	$('#expiryDate').text(mrz.getExpiryDate());
	$('#personalNumber').text(mrz.getPersonalNumber());
}

$(function() {
	$('#parse').on("click", parseMRZ);
});
