-- Step 1
CREATE TABLE ROLE (
RoleID VARCHAR (50),
RoleName CHAR (50) not null,
CONSTRAINT RolePK PRIMARY KEY(RoleID)
);

CREATE TABLE USER (
UserID VARCHAR (50),
RoleID VARCHAR (50) not null,
FirstName VARCHAR (50) not null,
LastName VARCHAR (50) not null,
Email VARCHAR (150) not null,
PhoneNo VARCHAR (15),
Address VARCHAR(150),
Password VARCHAR(50),
CONSTRAINT UserPK PRIMARY KEY(UserID),
CONSTRAINT UserFK FOREIGN KEY(RoleID) REFERENCES ROLE(RoleID)
ON UPDATE CASCADE
ON DELETE CASCADE
);

CREATE TABLE AUTHORITY (
AuthorityID VARCHAR (50),
AuthorityName VARCHAR (50) not null,
CONSTRAINT AuthPK PRIMARY KEY(AuthorityID)
);

CREATE TABLE AUTHORITY_INT (
UserID VARCHAR (50),
AuthorityID VARCHAR (50),
CreateDate datetime,
Constraint AuthINTPK Primary Key(UserID, AuthorityID),
Constraint AuthINTFK1 Foreign Key(UserID) References USER(UserID)ON UPDATE CASCADE ON DELETE CASCADE ,
Constraint AuthINTFK2 Foreign Key(AuthorityID) References AUTHORITY(AuthorityID)ON UPDATE CASCADE ON DELETE CASCADE 
);

CREATE TABLE HORSE (
HorseID VARCHAR (50),
Name VARCHAR (50) not null,
BirthDate Date,
Gender VARChar(10),
Breed VARCHAR(20),
Description VARCHAR(250),
CONSTRAINT HorsePK PRIMARY KEY(HorseID)
);

CREATE TABLE CONDITIONS (
ConditionID VARCHAR (50),
BodyPart VARCHAR (50),
Symptom VARCHAR(50),
Description VARCHAR(250),
CONSTRAINT ConPK PRIMARY KEY(ConditionID)
);

CREATE TABLE MEDICATION (
MedID VARCHAR(50),
MedName VARCHAR(50),
Description VARCHAR(250),
CONSTRAINT MedPK PRIMARY KEY(MedID)
);

-- Step 2
CREATE TABLE FOOD (
FoodID VARCHAR(50),
FoodName VARCHAR(50),
Type VARCHAR(20),
Description VARCHAR(250),
CONSTRAINT FoodPK PRIMARY KEY(FoodID)
);

CREATE TABLE WEIGHTCHECK (
WCID VARCHAR(50),
HorseID VARCHAR(50),
Weight decimal(6,2),
Date Date,
CONSTRAINT WCPK PRIMARY KEY(WCID),
CONSTRAINT WCFK FOREIGN KEY(HorseID) REFERENCES HORSE(HorseID)
ON UPDATE CASCADE
ON DELETE CASCADE
);


CREATE TABLE SCHEDULE (
ScheduleID VARCHAR(50),
HorseID VARCHAR(50),
UserID VARCHAR(50),
DateTime datetime,
Description VARCHAR(250),
CONSTRAINT SCPK PRIMARY KEY(ScheduleID),
CONSTRAINT SCFK1 FOREIGN KEY(HorseID) REFERENCES HORSE(HorseID)
ON UPDATE CASCADE
ON DELETE CASCADE,
CONSTRAINT SCFK2 FOREIGN KEY(UserID) REFERENCES USER(UserID)
ON UPDATE CASCADE
ON DELETE CASCADE
);

CREATE TABLE HORSE_CON_INT (
HorseID VARCHAR(50),
ConditionID VARCHAR(50),
Constraint HCINTPK Primary Key(HorseID, ConditionID),
Constraint HCINTFK1 Foreign Key(HorseID) References HORSE(HorseID)ON UPDATE CASCADE ON DELETE CASCADE ,
Constraint HCINTFK2 Foreign Key(ConditionID) References CONDITIONS(ConditionID)ON UPDATE CASCADE ON DELETE CASCADE 
);

CREATE TABLE HORSE_MED_INT (
HorseID VARCHAR(50),
MedID VARCHAR(50),
Portion Decimal(5,2),
Rate Decimal(3,1),
Constraint HMINTPK Primary Key(HorseID, MedID),
Constraint HMINTFK1 Foreign Key(HorseID) References HORSE(HorseID)ON UPDATE CASCADE ON DELETE CASCADE ,
Constraint HMINTFK2 Foreign Key(MedID) References MEDICATION(MedID)ON UPDATE CASCADE ON DELETE CASCADE 
);

CREATE TABLE HORSE_FOOD_INT (
HorseID VARCHAR(50),
FoodID VARCHAR(50),
Portion Decimal(5,2),
Rate Decimal(3,1),
Constraint HFINTPK Primary Key(HorseID, FoodID),
Constraint HFINTFK1 Foreign Key(HorseID) References HORSE(HorseID)ON UPDATE CASCADE ON DELETE CASCADE ,
Constraint HFINTFK2 Foreign Key(FoodID) References FOOD(FoodID)ON UPDATE CASCADE ON DELETE CASCADE 
);


CREATE TABLE OWNERSHIP_INT (
UserID VARCHAR (50),
HorseID VARCHAR(50),
AuthorityID VARCHAR(50),
CreateDate Date,
EndDate Date,
Constraint OWNPK Primary Key(UserID, HorseID, AuthorityID),
Constraint OWNFK1 Foreign Key(UserID) References USER(UserID)ON UPDATE CASCADE ON DELETE CASCADE ,
Constraint OWNFK2 Foreign Key(HorseID) References HORSE(HorseID)ON UPDATE CASCADE ON DELETE CASCADE,
Constraint OWNFK3 Foreign Key(AuthorityID) References AUTHORITY(AuthorityID)ON UPDATE CASCADE ON DELETE CASCADE 
);

