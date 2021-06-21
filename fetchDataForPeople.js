const Sequelize = require('sequelize');
const axios = require('axios');
const Op = require('sequelize').Op;
const Model = Sequelize.Model;
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const cliSelect = require('cli-select');

let CHECKING_ARRAY = [];

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

const fetchDataForPeople = async (fileName) => {
	const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
		host: process.env.DB_HOST,
		dialect: process.env.DB_DIALECT,
		logging: false
	});

	class Person extends Model {}

	Person.init(
		{
			_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true
			},
			tconst: {
				type: Sequelize.STRING
				// primaryKey: true,
				// unique: true
			},
			id: {
				type: Sequelize.INTEGER
			},
			name: {
				type: Sequelize.STRING
			},
			birthday: {
				type: Sequelize.STRING,
				allowNull: true
			},
			known_for_department: {
				type: Sequelize.STRING
			},
			deathday: {
				type: Sequelize.STRING,
				allowNull: true
			},
			popularity: {
				type: Sequelize.FLOAT
			},
			gender: {
				type: Sequelize.INTEGER
			},
			biography: {
				type: Sequelize.STRING
			},
			profile_path: {
				type: Sequelize.STRING,
				allowNull: true
			},
			place_of_birth: {
				type: Sequelize.STRING,
				allowNull: true
			},
			adult: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			},
			checked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			},
			homepage: {
				type: Sequelize.STRING,
				allowNull: true
			}
		},
		{
			sequelize,
			modelName: 'Person',
			tableName: 'person',
			timestamps: false,
			freezeTableName: true
		}
	);

	console.log(CONSOLE_COLORS.FgCyan, 'Should create the database?');
	cliSelect({ values: [ 'Yes', 'No' ] })
		.then(async (res) => {
			if (res.value == 'Yes') {
				console.log('Database synchronization...');
				await sequelize.sync();
				// await Movie.sync({ alter: true });
				// await Genre.sync({ alter: true });
				// await MovieGenres.sync({ alter: true });
			}

			sequelize
				.authenticate()
				.then(async () => {
					console.log('Connection has been established successfully.');

					const data = fs.readFileSync(`./data/${fileName}.csv`, 'UTF-8');

					// split the contents by new line
					const lines = data.split(/\r?\n/);

					// print all lines

					if (res.value == 'Yes') {
						console.log(CONSOLE_COLORS.FgYellow, 'Inserting initial records...');
						let peopleArray = [];
						for (let i = 0; i <= lines.length - 1; i++) {
							try {
								peopleArray.push({ tconst: lines[i].split('"').join('') });
								// const movie = await Movie.findOrCreate({
								//   where: { tconst: lines[i] },
								// });
							} catch (err) {
								console.log(CONSOLE_COLORS.FgRed, err);
								break;
							}
							continue;
						}

						await Person.bulkCreate(peopleArray);
					}

					if (res.value != 'Yes') {
						console.log(CONSOLE_COLORS.FgYellow, 'Database build skipped');
					}

					console.log(CONSOLE_COLORS.FgWhite, 'Database is ready to fetch data');
					console.log(CONSOLE_COLORS.FgBlue, 'Starting the fetching process...');

					let offset = 0;

					setInterval(async function() {
						loopThroughDatabasePeople(offset, Person);
						offset++;
						try {
							const amount = await Person.count({
								where: {
									name: { [Op.not]: null }
								}
							});
							console.log(
								CONSOLE_COLORS.FgGreen,
								`Fetched ${amount} people. Checking ${CHECKING_ARRAY.length} people. ${new Date()}`,
								new Date()
							);
						} catch (err) {
							console.log(err);
						}
					}, 5000);
				})
				.catch((err) => {
					console.error(CONSOLE_COLORS.FgRed, 'Unable to connect to the database:', err);
				});
		})
		.catch((err) => {
			console.log(err);
			console.log('Cancelled');
		});
};

const loopThroughDatabasePeople = async (offset, PersonModel) => {
	await PersonModel.findAll({
		limit: 500,
		offset: offset ? offset : 0,
		where: {
			name: null,
			checked: false
		},
		// order: sequelize.random()
		order: [ [ 'id', offset % 2 == 0 ? 'ASC' : 'DESC' ] ]
	}).then(async (allPeople) => {
		for (let i = 0; i < allPeople.length; i++) {
			try {
				await PersonModel.update(
					{
						checked: true
					},
					{
						where: { tconst: allPeople[i].tconst }
					}
				);

				if (!allPeople[i].tconst) {
					continue;
				}
				if (CHECKING_ARRAY.includes(allPeople[i].tconst)) {
					continue;
				}

				CHECKING_ARRAY.push(allPeople[i].tconst);

				// console.log("Checking ", wholeDB[i].tconst);

				const getImdbIdLink = `https://api.themoviedb.org/3/find/${allPeople[i].tconst}`;
				// console.log("LINK", getImdbIdLink);
				const { data: imdbData } = await axios.get(getImdbIdLink, {
					params: {
						api_key: process.env.TMDB_API_KEY,
						external_source: 'imdb_id'
					}
				});

				try {
					if (imdbData.person_results.length > 0) {
						const tmdbId = imdbData.person_results[0].id;
						const personToUpdate = await PersonModel.findOne({ where: { tconst: allPeople[i].tconst } });

						const { data } = await axios.get(`https://api.themoviedb.org/3/person/${tmdbId}`, {
							params: {
								api_key: process.env.TMDB_API_KEY
							}
						});

						personToUpdate.birthday = data.birthday;
						personToUpdate.id = data.id;
						personToUpdate.known_for_department = data.known_for_department;
						personToUpdate.popularity = data.popularity;
						personToUpdate.deathday = data.deathday;
						personToUpdate.gender = data.gender;
						personToUpdate.biography = data.biography;
						personToUpdate.profile_path = data.profile_path;
						personToUpdate.adult = data.adult;
						personToUpdate.homepage = data.homepage;
						personToUpdate.name = data.name;

						await personToUpdate.save();

						const index = CHECKING_ARRAY.indexOf(allPeople[i].tconst);
						if (index > -1) {
							CHECKING_ARRAY.splice(index, 1);
						}
					} else {
						// console.log(CONSOLE_COLORS.FgRed, `Missing: ${allMovies[i].tconst}`);
					}
				} catch (err) {
					console.log(CONSOLE_COLORS.FgRed, err);
					break;
				}

				// wholeDB[i].update({
				//   adult: data.adult,
				//   budget: data.budget,
				//   original_language: data.original_language
				// })
			} catch (err) {
				console.log(CONSOLE_COLORS.FgRed, err);
				break;
			}
		}
	});
};

exports.fetchDataForPeople = fetchDataForPeople;
