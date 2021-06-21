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

const fetchDataForMovies = async (fileName) => {
	// const sequelize = new Sequelize({
	// 	dialect: 'sqlite',
	// 	storage: `./${fileName}.db`,
	// 	logging: false,
	// 	// transactionType: 'IMMEDIATE',
	// 	retry: {
	// 		max: 10
	// 	}
	// });

	// const sequelize = new Sequelize('movies', 'root', '', {
	// 	host: process.env.DB_HOST,
	// 	dialect: process.env.DB_DIALECT,
	// 	logging: false
	// });

	const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
		host: process.env.DB_HOST,
		dialect: process.env.DB_DIALECT,
		logging: false
	});

	class Movie extends Model {}
	class Genre extends Model {}
	class SpokenLanguage extends Model {}
	class ProductionCompany extends Model {}
	class ProductionCountry extends Model {}

	class MovieGenres extends Model {}
	class MovieSpokenLanguages extends Model {}
	class MovieProductionCompanies extends Model {}
	class MovieProductionCountries extends Model {}

	ProductionCountry.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			iso_3166_1: {
				type: Sequelize.STRING
			},
			name: {
				type: Sequelize.STRING
			}
		},
		{
			sequelize,
			modelName: 'ProductionCountry',
			tableName: 'production_country',
			timestamps: false,
			freezeTableName: true
		}
	);

	ProductionCompany.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			name: {
				type: Sequelize.STRING
			},
			origin_country: {
				type: Sequelize.STRING
			}
		},
		{
			sequelize,
			modelName: 'ProductionCompany',
			tableName: 'production_company',
			timestamps: false,
			freezeTableName: true
		}
	);

	SpokenLanguage.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			iso_639_1: {
				type: Sequelize.STRING
			},
			name: {
				type: Sequelize.STRING
			}
		},
		{
			sequelize,
			modelName: 'SpokenLanguage',
			tableName: 'spoken_language',
			timestamps: false,
			freezeTableName: true
		}
	);

	Genre.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			tmdbId: {
				type: Sequelize.INTEGER
			},
			name: Sequelize.STRING
		},
		{
			sequelize,
			modelName: 'Genre',
			tableName: 'genre',
			timestamps: false,
			freezeTableName: true
		}
	);

	Movie.init(
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
			original_language: {
				type: Sequelize.STRING
			},
			original_title: {
				type: Sequelize.STRING
			},
			overview: {
				type: Sequelize.STRING,
				allowNull: true
			},
			popularity: {
				type: Sequelize.FLOAT
			},
			status: {
				type: Sequelize.STRING
			},
			title: {
				type: Sequelize.STRING
			},
			vote_average: {
				type: Sequelize.INTEGER
			},
			vote_count: {
				type: Sequelize.INTEGER
			},
			tagline: {
				type: Sequelize.STRING,
				allowNull: true
			},
			budget: {
				type: Sequelize.INTEGER
			},
			adult: {
				type: Sequelize.BOOLEAN
			},
			revenue: {
				type: Sequelize.INTEGER
			},
			release_date: {
				type: Sequelize.STRING
			},
			checked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			}
		},
		{
			sequelize,
			modelName: 'Movie',
			tableName: 'movie',
			timestamps: false,
			freezeTableName: true
		}
	);

	MovieGenres.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			tconst: {
				type: Sequelize.STRING
			},
			genre: {
				type: Sequelize.INTEGER
			}
		},
		{
			sequelize,
			modelName: 'MovieGenre',
			tableName: 'movie_genre',
			timestamps: false,
			freezeTableName: true
		}
	);

	MovieSpokenLanguages.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			tconst: {
				type: Sequelize.STRING
			},
			spoken_language: {
				type: Sequelize.INTEGER
			}
		},
		{
			sequelize,
			modelName: 'MovieSpokenLanguage',
			tableName: 'movie_spoken_language',
			timestamps: false,
			freezeTableName: true
		}
	);

	MovieProductionCompanies.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			tconst: {
				type: Sequelize.STRING
			},
			production_company: {
				type: Sequelize.INTEGER
			}
		},
		{
			sequelize,
			modelName: 'MovieProductionCompany',
			tableName: 'movie_production_company',
			timestamps: false,
			freezeTableName: true
		}
	);

	MovieProductionCountries.init(
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			tconst: {
				type: Sequelize.STRING
			},
			production_country: {
				type: Sequelize.INTEGER
			}
		},
		{
			sequelize,
			modelName: 'MovieProductionCountry',
			tableName: 'movie_production_country',
			timestamps: false,
			freezeTableName: true
		}
	);

	Movie.hasMany(MovieGenres, { foreignKey: 'tconst', targetKey: 'tconst', unique: false });
	Genre.hasMany(MovieGenres, { foreignKey: 'genre', targetKey: 'id', unique: false });

	Movie.hasMany(MovieSpokenLanguages, { foreignKey: 'tconst', targetKey: 'tconst', unique: false });
	SpokenLanguage.hasMany(MovieSpokenLanguages, { foreignKey: 'spoken_language', targetKey: 'id', unique: false });

	Movie.hasMany(MovieProductionCompanies, { foreignKey: 'tconst', targetKey: 'tconst', unique: false });
	ProductionCompany.hasMany(MovieProductionCompanies, {
		foreignKey: 'production_company',
		targetKey: 'id',
		unique: false
	});

	Movie.hasMany(MovieProductionCountries, { foreignKey: 'tconst', targetKey: 'tconst', unique: false });
	ProductionCountry.hasMany(MovieProductionCountries, {
		foreignKey: 'production_country',
		targetKey: 'id',
		unique: false
	});

	// Genre.hasOne(MovieGenres)
	// MovieGenres.belongsTo(Movie, { foreignKey: 'tconst', targetKey: 'tconst' });
	// MovieGenres.belongsTo(Genre, { foreignKey: 'tconst', targetKey: 'tconst' });

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
						let moviesArray = [];
						for (let i = 0; i <= lines.length - 1; i++) {
							try {
								moviesArray.push({ tconst: lines[i].split('"').join('') });
								// const movie = await Movie.findOrCreate({
								//   where: { tconst: lines[i] },
								// });
							} catch (err) {
								console.log(CONSOLE_COLORS.FgRed, err);
								break;
							}
							continue;
						}

						await Movie.bulkCreate(moviesArray);
					}

					if (res.value != 'Yes') {
						console.log(CONSOLE_COLORS.FgYellow, 'Database build skipped');
					}

					console.log(CONSOLE_COLORS.FgWhite, 'Database is ready to fetch data');
					console.log(CONSOLE_COLORS.FgBlue, 'Starting the fetching process...');

					let offset = 0;

					setInterval(async function() {
						loopThroughDatabaseMovies(
							offset,
							Movie,
							MovieGenres,
							Genre,
							ProductionCompany,
							MovieProductionCompanies,
							ProductionCountry,
							MovieProductionCountries,
							SpokenLanguage,
							MovieSpokenLanguages
						);
						offset++;
						try {
							const amount = await Movie.count({
								where: {
									original_title: { [Op.not]: null }
								}
							});
							console.log(
								CONSOLE_COLORS.FgGreen,
								`Fetched ${amount} movies. Checking ${CHECKING_ARRAY.length} movies. ${new Date()}`,
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

	// console.log("xd");
};

const loopThroughDatabaseMovies = async (
	offset,
	MovieModel,
	MovieGenres,
	Genre,
	ProductionCompany,
	MovieProductionCompanies,
	ProductionCountry,
	MovieProductionCountries,
	SpokenLanguage,
	MovieSpokenLanguages
) => {
	await MovieModel.findAll({
		limit: 500,
		offset: offset ? offset : 0,
		where: {
			original_title: null,
			checked: false
		},
		// order: sequelize.random()
		order: [ [ 'tconst', offset % 2 == 0 ? 'ASC' : 'DESC' ] ]
	}).then(async (allMovies) => {
		for (let i = 0; i < allMovies.length; i++) {
			try {
				await MovieModel.update(
					{
						checked: true
					},
					{
						where: { tconst: allMovies[i].tconst }
					}
				);

				if (!allMovies[i].tconst) {
					continue;
				}
				if (CHECKING_ARRAY.includes(allMovies[i].tconst)) {
					continue;
				}

				CHECKING_ARRAY.push(allMovies[i].tconst);

				// console.log("Checking ", wholeDB[i].tconst);

				const getImdbIdLink = `https://api.themoviedb.org/3/find/${allMovies[i].tconst}`;
				// console.log("LINK", getImdbIdLink);
				const { data: imdbData } = await axios.get(getImdbIdLink, {
					params: {
						api_key: process.env.TMDB_API_KEY,
						external_source: 'imdb_id'
					}
				});

				try {
					if (imdbData.movie_results.length > 0) {
						const tmdbId = imdbData.movie_results[0].id;
						const movieToUpdate = await MovieModel.findOne({ where: { tconst: allMovies[i].tconst } });

						const { data } = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
							params: {
								api_key: process.env.TMDB_API_KEY
							}
						});

						movieToUpdate.original_language = data.original_language;
						movieToUpdate.original_title = data.original_title;
						movieToUpdate.overview = data.overview;
						movieToUpdate.popularity = data.popularity;
						movieToUpdate.status = data.status;
						movieToUpdate.title = data.title;
						movieToUpdate.vote_average = data.vote_average;
						movieToUpdate.vote_count = data.vote_count;
						movieToUpdate.tagline = data.tagline;
						movieToUpdate.budget = data.budget;
						movieToUpdate.adult = data.adult;
						movieToUpdate.revenue = data.revenue;
						movieToUpdate.release_date = data.release_date;

						await movieToUpdate.save();

						for (const movieGenre of data.genres) {
							await Genre.findOrCreate({
								where: {
									name: movieGenre.name,
									tmdbId: movieGenre.id
								}
							});

							const genre = await Genre.findOne({
								where: {
									name: movieGenre.name
								}
							});

							await MovieGenres.findOrCreate({
								where: {
									genre: genre.id,
									tconst: movieToUpdate.tconst
								}
							});
						}

						for (const productionCountry of data.production_countries) {
							await ProductionCountry.findOrCreate({
								where: {
									iso_3166_1: productionCountry.iso_3166_1,
									name: productionCountry.name
								}
							});

							const myProductionCountry = await ProductionCountry.findOne({
								where: {
									iso_3166_1: productionCountry.iso_3166_1,
									name: productionCountry.name
								}
							});

							await MovieProductionCountries.findOrCreate({
								where: {
									production_country: myProductionCountry.id,
									tconst: movieToUpdate.tconst
								}
							});
						}

						for (const productionCompany of data.production_companies) {
							await ProductionCompany.findOrCreate({
								where: {
									origin_country: productionCompany.origin_country,
									name: productionCompany.name
								}
							});

							const myProductionCompany = await ProductionCompany.findOne({
								where: {
									origin_country: productionCompany.origin_country,
									name: productionCompany.name
								}
							});

							await MovieProductionCompanies.findOrCreate({
								where: {
									production_company: myProductionCompany.id,
									tconst: movieToUpdate.tconst
								}
							});
						}

						for (const spokenLanguage of data.spoken_languages) {
							await SpokenLanguage.findOrCreate({
								where: {
									iso_639_1: spokenLanguage.iso_639_1,
									name: spokenLanguage.name
								}
							});

							const mySpokenLanguage = await SpokenLanguage.findOne({
								where: {
									iso_639_1: spokenLanguage.iso_639_1,
									name: spokenLanguage.name
								}
							});

							await MovieSpokenLanguages.findOrCreate({
								where: {
									spoken_language: mySpokenLanguage.id,
									tconst: movieToUpdate.tconst
								}
							});
						}

						const index = CHECKING_ARRAY.indexOf(allMovies[i].tconst);
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

exports.fetchDataForMovies = fetchDataForMovies;
// export default fetchDataForMovies;
