const Sequelize = require("sequelize");
const axios = require("axios");
const Op = require("sequelize").Op;
const Model = Sequelize.Model;
require("dotenv").config();

//requiring path and fs modules
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const cliSelect = require("cli-select");

const CONSOLE_COLORS = {
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
};

async function start() {
  try {
    console.log("Program has started...");
    const directoryPath = path.join(__dirname, "/data");
    console.log(CONSOLE_COLORS.FgBlue, "Checking ", directoryPath);
    const files = await fsPromises.readdir(directoryPath);

    const csvFiles = [];

    files.forEach(function (file) {
      // Do whatever you want to do with the file
      const extension = path.extname(file);

      if (extension == ".csv") {
        csvFiles.push(file);
      }
    });

    if (!csvFiles.length) {
      console.log(CONSOLE_COLORS.FgRed, "No CSV files in data directory");
      return;
    }

    console.log(CONSOLE_COLORS.FgCyan, "Please select file:");
    cliSelect({ values: csvFiles })
      .then((response) => {
        console.log(CONSOLE_COLORS.FgGreen, "Selected: " + response.value);
        const selectedFile = response.value;
        console.log(CONSOLE_COLORS.FgCyan, "Please select type of data:");
        cliSelect({ values: ["Movies", "People"] })
          .then((response) => {
            console.log(CONSOLE_COLORS.FgGreen, "Selected: " + response.value);

            const fileName = selectedFile.split(".").slice(0, -1).join(".");
            if (response.value == "Movies") {
              fetchDataForMovies(fileName);
            } else {
              fetchDataForPeople(fileName);
            }
          })
          .catch(() => {
            console.log("Cancelled");
          });
      })
      .catch(() => {
        console.log("Cancelled");
      });
  } catch (err) {
    console.error("Error occured while reading directory!", err);
  }
}

start();

const fetchDataForMovies = async (fileName) => {
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: `./${fileName}.db`,
  });
  class Movie extends Model {}

  Movie.init(
    {
      tconst: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true,
      },
      genre: {
        type: Sequelize.STRING,
      },
      original_language: {
        type: Sequelize.STRING,
      },
      original_title: {
        type: Sequelize.STRING,
      },
      overview: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      populariy: {
        type: Sequelize.NUMBER,
      },
      status: {
        type: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING,
      },
      vote_average: {
        type: Sequelize.NUMBER,
      },
      vote_count: {
        type: Sequelize.NUMBER,
      },
      tagline: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      budget: {
        type: Sequelize.NUMBER,
      },
      adult: {
        type: Sequelize.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: "Movie",
      tableName: "Movie",
      timestamps: false,
      freezeTableName: true,
    }
  );

  console.log(CONSOLE_COLORS.FgCyan, "Should rebuild database?");
  cliSelect({ values: ["Yes", "No"] })
    .then(async (res) => {
      if (res.value == "Yes") {
        console.log("Checking database...");
        await Movie.sync({ alter: true });
      }

      sequelize
        .authenticate()
        .then(async () => {
          console.log("Connection has been established successfully.");

          const data = fs.readFileSync(`./data/${fileName}.csv`, "UTF-8");

          // split the contents by new line
          const lines = data.split(/\r?\n/);

          // print all lines

          if (res.value == "Yes") {
            for (let i = 0; i <= lines.length - 1; i++) {
              try {
                const movie = await Movie.findOrCreate({
                  where: { tconst: lines[i] },
                });
              } catch (err) {
                console.log(CONSOLE_COLORS.FgRed, err);
                break;
              }
              continue;
            }
          }

          if (res.value != "Yes") {
            console.log(CONSOLE_COLORS.FgYellow, "Database build skipped");
          }

          console.log(
            CONSOLE_COLORS.FgWhite,
            "Database is ready to fetch data"
          );
          console.log(
            CONSOLE_COLORS.FgBlue,
            "Starting the fetching process..."
          );

          let offset = 0;
          setInterval(async function () {
            loopThroughDatabaseMovies(offset, Movie);
            offset++;
            const amount = await Movie.count({
              where: {
                genre: { [Op.not]: null },
              },
            });
            console.log(
              CONSOLE_COLORS.FgMagenta,
              `Fetched ${amount} movies. Page ${offset}`,
              new Date()
            );
          }, 5000);
        })
        .catch((err) => {
          console.error("Unable to connect to the database:", err);
        });
    })
    .catch((err) => {
      console.log("Cancelled");
    });

  // console.log("xd");
};

const loopThroughDatabaseMovies = (offset, model) => {
  model
    .findAll({
      limit: 55,
      offset: offset ? offset : 0,
      where: {
        genre: null,
      },
      order: [["tconst", "ASC"]],
    })
    .then(async (wholeDB) => {
      for (let i = 0; i < wholeDB.length; i++) {
        try {
          if (!wholeDB[i].tconst) {
            continue;
          }
          // console.log("Checking ", wholeDB[i].tconst);

          const getImdbIdLink = `https://api.themoviedb.org/3/find/${wholeDB[i].tconst}`;
          // console.log("LINK", getImdbIdLink);
          const { data: imdbData } = await axios.get(getImdbIdLink, {
            params: {
              api_key: process.env.TMDB_API_KEY,
              external_source: "imdb_id",
            },
          });

          try {
            if (imdbData.movie_results.length > 0) {
              const tmdbId = imdbData.movie_results[0].id;
              // console.log("TMDBID", tmdbId);
              const { data } = await axios.get(
                `https://api.themoviedb.org/3/movie/${tmdbId}`,
                {
                  params: {
                    api_key: process.env.TMDB_API_KEY,
                  },
                }
              );

              // console.log(
              //   CONSOLE_COLORS.FgBlue,
              //   "Movie fetched: ",
              //   data.original_title
              // );
            } else {
              const { data } = await axios.get(
                `https://imdb-api.com/API/Title/k_s3htpv34/${wholeDB[i].tconst}`
              );

              if (data.title) {
                console.log(
                  CONSOLE_COLORS.FgYellow,
                  "Movie fetched: ",
                  data.title
                );
              } else {
                console.log(
                  CONSOLE_COLORS.FgRed,

                  wholeDB[i].tconst
                );
                console.log(CONSOLE_COLORS.FgWhite);
              }
            }
          } catch (err) {
            console.log(CONSOLE_COLORS.FgRed, err);
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
