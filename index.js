const Sequelize = require('sequelize');
const axios = require('axios');
const Op = require('sequelize').Op;
const Model = Sequelize.Model;
require('dotenv').config();

const { fetchDataForMovies } = require('./fetchDataForMovies');
const { fetchDataForPeople } = require('./fetchDataForPeople');

//requiring path and fs modules
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const cliSelect = require('cli-select');

const CONSOLE_COLORS = {
	FgBlack: '\x1b[30m',
	FgRed: '\x1b[31m',
	FgGreen: '\x1b[32m',
	FgYellow: '\x1b[33m',
	FgBlue: '\x1b[34m',
	FgMagenta: '\x1b[35m',
	FgCyan: '\x1b[36m',
	FgWhite: '\x1b[37m'
};
async function start() {
	try {
		console.log('Program has started...');

		if (
			!process.env.TMDB_API_KEY ||
			!process.env.DB_USER ||
			typeof process.env.DB_PASSWORD == 'undefined' ||
			!process.env.DB_HOST ||
			!process.env.DB_NAME ||
			!process.env.DB_DIALECT
		) {
			console.log(CONSOLE_COLORS.FgRed, 'Check .env file, not everything is provided.');
			console.log(CONSOLE_COLORS.FgWhite);
			return;
		}
		const directoryPath = path.join(__dirname, '/data');
		console.log(CONSOLE_COLORS.FgBlue, 'Checking ', directoryPath);
		const files = await fsPromises.readdir(directoryPath);

		const csvFiles = [];

		files.forEach(function(file) {
			// Do whatever you want to do with the file
			const extension = path.extname(file);

			if (extension == '.csv') {
				csvFiles.push(file);
			}
		});

		if (!csvFiles.length) {
			console.log(CONSOLE_COLORS.FgRed, 'No CSV files in data directory');
			return;
		}

		console.log(CONSOLE_COLORS.FgCyan, 'Please select file:');
		cliSelect({ values: csvFiles })
			.then((response) => {
				console.log(CONSOLE_COLORS.FgGreen, 'Selected: ' + response.value);
				const selectedFile = response.value;
				console.log(CONSOLE_COLORS.FgCyan, 'Please select type of data:');
				cliSelect({ values: [ 'Movies', 'People' ] })
					.then((response) => {
						console.log(CONSOLE_COLORS.FgGreen, 'Selected: ' + response.value);

						const fileName = selectedFile.split('.').slice(0, -1).join('.');
						if (response.value == 'Movies') {
							fetchDataForMovies(fileName);
						} else {
							fetchDataForPeople(fileName);
						}
					})
					.catch((e) => {
						console.log(e);
						console.log('Cancelled');
					});
			})
			.catch(() => {
				console.log('Cancelled');
			});
	} catch (err) {
		console.error('Error occured while reading directory!', err);
	}
}

start();

// //joining path of directory
// const directoryPath = path.join(__dirname, "/data");
// //passsing directoryPath and callback function
// console.log(directoryPath);
// console.log("Program has started...");
// fs.readdir(directoryPath, function (err, files) {
//   //handling error
//   if (err) {
//     return console.log("Unable to scan directory: " + err);
//   }
//   //listing all files using forEach
//   const csvFiles = [];

//   files.forEach(function (file) {
//     // Do whatever you want to do with the file
//     const extension = path.extname(file);

//     if (extension == ".csv") {
//       csvFiles.push(file);
//     }
//   });
// });

// const sequelize = new Sequelize({
//   dialect: "sqlite",
//   storage: "./imdb_2.db",
// });

// const Model = Sequelize.Model;
// const Op = require("sequelize").Op;

// class imdb extends Model {}
// imdb.init(
//   {
//     tconst: {
//       type: Sequelize.STRING,
//       primaryKey: true,
//       unique: true,
//     },
//     country: {
//       type: Sequelize.STRING,
//       allowNull: false,
//     },
//   },
//   {
//     sequelize,
//     modelName: "imdb",
//     tableName: "imdb",
//     timestamps: false,
//     freezeTableName: true,
//     // options
//   }
// );

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log("Connection has been established successfully.");
//   })
//   .catch((err) => {
//     console.error("Unable to connect to the database:", err);
//   });
