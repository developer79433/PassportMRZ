/**
 * Test harness for passport MRZ parser.
 */

"use strict";

function parseMRZ() {
	var mrz, input = $("#mrz");
	try {
		mrz = MRZ.create(input.val());
	} catch (e) {
		console.log(e);
		return;
	}
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
