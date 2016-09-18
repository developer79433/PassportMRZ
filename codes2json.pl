#!/usr/bin/perl

use strict;
use warnings;

foreach(<>) {
	s/\r//g;
	chomp;
	if (/^(.*)\s+([A-Z]{1,3})$/) {
		print "\"$2\": \"$1\",\n";
	} else {
		die "Unrecognised line: $_";
	}
}
