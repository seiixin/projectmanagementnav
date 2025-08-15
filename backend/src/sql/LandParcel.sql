CREATE TABLE LandParcel ( 
	parcelID BIGINT PRIMARY KEY AUTO_INCREMENT, 
	improvement BOOLEAN, 
	totalValue DOUBLE, 
	StreetAddress TEXT, 
	Barangay TEXT, 
	Municipality TEXT, 
	ZipCode INT, 
	areaSize DOUBLE, 
	propertyType TEXT, 
	actualLandUse TEXT ) 
AUTO_INCREMENT = 1000000;