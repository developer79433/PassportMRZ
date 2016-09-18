/**
 * Test harness for passport MRZ parser.
 */

function parseMRZ() {
	var mrz, input = $("#mrz");
	try {
		mrz = new MRZ(input.val());
	} catch (e) {
		console.log(e);
		return;
	}
	$('#passportType').text(mrz.getPassportType());
	$('#issuer').text(mrz.getIssuerFull());
	$('#lastName').text(mrz.getLastName());
	$('#otherNames').text(mrz.getOtherNames());
	$('#passportNumber').text(mrz.getPassportNumber());
	$('#nationality').text(mrz.getNationalityFull());
	$('#birthDate').text(mrz.getBirthDate());
	$('#sex').text(mrz.getSexFull());
	$('#expiryDate').text(mrz.getExpiryDate());
	$('#personalNumber').text(mrz.getPersonalNumber());
}

$(function() {
	$('#parse').on("click", parseMRZ);
});
