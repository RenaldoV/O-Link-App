-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Feb 02, 2016 at 12:57 PM
-- Server version: 5.6.17
-- PHP Version: 5.5.12
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
CREATE database o_link;
use o_link;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `o-link`
--

-- --------------------------------------------------------

--
-- Table structure for table `employers`
--

CREATE TABLE IF NOT EXISTS `employers` (
  `employerID` int(11) NOT NULL AUTO_INCREMENT,
  `companyName` varchar(100) NOT NULL,
  `businessCategory` varchar(40) NOT NULL,
  `companyRegistrationNo` varchar(100) NOT NULL,
  `geographicalLocation` text NOT NULL,
  `name` varchar(40) NOT NULL,
  `surname` varchar(40) NOT NULL,
  `ID` varchar(13) NOT NULL,
  `position` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contactNo` varchar(10) NOT NULL,
  `alternateName` varchar(40) NOT NULL,
  `alternateSurname` varchar(40) NOT NULL,
  `alternateContactNo` varchar(10) NOT NULL,
  `signUpDate` datetime NOT NULL,
  `passwordHash` varchar(150) NOT NULL,
  profilePicture varchar (140),
  lastSeen dateTime,
  PRIMARY KEY (`employerID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE IF NOT EXISTS `students` (
  `studentID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `surname` varchar(40) NOT NULL,
  `dob` date NOT NULL,
  `studentNo` text NOT NULL,
  `email` varchar(50) NOT NULL,
  `contactNo` varchar(10) NOT NULL,
  `ID` varchar(13) NOT NULL,
  `gender` varchar(1) NOT NULL,
  `location` text NOT NULL,
  `fieldOfStudy` varchar(100) NOT NULL,
  `qualificationName` varchar(100) NOT NULL,
  `currentYear` tinyint(4) NOT NULL,
  `gradYear` year(4) NOT NULL,
  `postGraduate` tinyint(1) NOT NULL,
  `GPA` decimal(3,2) NOT NULL,
  `passwordHash` varchar(150) NOT NULL,
  `signupDate` datetime NOT NULL,
  profilePicture varchar (140),
  lastSeen dateTime,
  PRIMARY KEY (`studentID`),
  UNIQUE KEY `email` (`email`,`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;


CREATE TABLE IF NOT EXISTS workExperience(
expID int not null auto_increment primary key,
studentID int(11) not null,
role varchar(40) not null,
bodyText varchar (140),
duration varchar(40) not null,
contactPersonName varchar(40),
contactPersonNumber varchar(12) 
);

CREATE TABLE IF NOT EXISTS matricResults(
resultID int not null auto_increment primary key,
studentID int(11) not null,
`subject` varchar(10) not null,
mark decimal(5,2) not null

);

CREATE TABLE IF NOT EXISTS applicationLog(
logID int not null auto_increment primary key,
studentID int(11) not null,
jobID int(11) not null,
`type` varchar(40) not null,
`timestamp` dateTime

);

CREATE TABLE IF NOT EXISTS jobs(
jobID int not null auto_increment primary key,
employeeID int not null,
title varchar(40) not null,
bodyText varchar (140),
location varchar(140) not null,
payrate decimal(10,2),
payPer varchar(5) not null,
startingDate dateTime not null,
duration varchar(40) not null,
postDate dateTime not null,
category varchar(12),
spotsAvailable int not null 
);

CREATE TABLE IF NOT EXISTS photos(
photoID int not null auto_increment primary key,
studentID int not null,
imagePath varchar (140)
);


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


