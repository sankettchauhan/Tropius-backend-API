const express = require("express");
const auth = require("../middlewares/auth");
const { Genre, validateId: validateGenreId } = require("../models/genre");
const router = express.Router();
const { Movie, validateMovie, validateId } = require("../models/movie");

router.get("/", auth, getMovies);
router.post("/", auth, createMovie);
router.put("/:id", auth, updateMovie);
router.delete("/:id", auth, deleteMovie);
router.get("/:id", auth, getMovieById);

async function getMovies(req, res) {
  try {
    const movies = await Movie.find();
    res.status(200).send(movies);
  } catch (error) {
    res.status(400).send(`Error : ${error.message}`);
  }
}

async function createMovie(req, res) {
  const { error } = validateMovie(req.body);
  // const { error: errorGenre } = validateGenreId(req.body.genreId);
  if (error) return res.status(400).send(error.details[0].message);
  // if (errorGenre) return res.status(400).send(errorGenre.details[0].message);
  else {
    // check if the genre sent is valid (with the db)
    let genres = req.body.genreIds;
    // create a promise array for all the genres
    let genresPromises = genres.map((genreId) => Genre.findById(genreId));
    // await res from all the promises
    genres = await Promise.all(genresPromises);
    // create a movie
    let movie = new Movie({
      ...req.body,
      genres: genres.map((genre) => ({ id: genre._id, name: genre.name })),
    });
    try {
      // try saving in the db
      movie = await movie.save();
      // send success res
      res.status(201).send(movie);
    } catch (error) {
      // send error if failed
      res.status(400).send(`Error: ${error.message}`);
    }
  }
}

async function updateMovie(req, res) {
  const { id } = req.params;
  const { error: errorMovie } = validateMovie(req.body);
  const { error: errorId } = validateId(id);
  if (errorMovie) return res.status(400).send(errorMovie.message);
  if (errorId) return res.status(400).send(errorId.message);
  try {
    const movie = await Movie.findByIdAndUpdate(id, req.body);
    if (!movie)
      return res
        .status(404)
        .send(`The movie with given id ${id} is not found.`);
    res.status(200).send(`Movie updated : ${movie}`);
  } catch (error) {
    console.log(error.message);
    res.status(400).send(`Error : ${error.message}`);
  }
}

async function deleteMovie(req, res) {
  const { id } = req.params;
  try {
    const result = await Movie.findByIdAndDelete(id);
    if (!result)
      return res.status(400).send(`Could not find movie with id ${id}`);
    res.status(200).send(`Deleted movie: ${result}`);
  } catch (error) {
    console.log(error.message);
    res.status(400).send(`Error : ${error.message}`);
  }
}

async function getMovieById(req, res) {
  const { id } = req.params;
  const { error } = validateId(id);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const movie = await Movie.findById(id);
    if (!movie)
      return res.status(404).send(`Requested movie with id ${id} not found.`);
    res.status(200).send(movie);
  } catch (error) {
    console.log(error.message);
    res.status(400).send(`Error : ${error.message}`);
  }
}

module.exports = router;
