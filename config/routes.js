const server = require("express").Router();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secret =  "Secret";


const Users = require('../database/dbConfig.js');

const { authenticate } = require('../auth/authenticate');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};


async function register(req, res) {

  const userCreds = req.body;
  const { username, password } = userCreds;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: `I need username and password` });
  }
  const solt = 10
  const hash = bcrypt.hashSync(password, solt);
  req.body.password = hash;
  try {
    const [id] = await Users("users").insert(userCreds);
    const user = await Users("users")
      .where({ id })
      .first();
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json(error);
  }
};

async function login(req, res) {
  // implement user login

const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "I need username and password" });
  }
  try {
    const user = await Users("users")
      .where({ username })
      .first();
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = generateToken(user);
      console.log(token)
      res
        .status(200)
        .json({ message: `Welcome ${user.username}, have a token`, token });
    } else {
      res
        .status(401)
        .json({
          message: "Error, try again"
        });
    }
  } catch (error) {
    res.status(500).json(error);
  }
}	


function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };
  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}


function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const options = {
    expiresIn: '1h'

  }
  console.log(user)
  return jwt.sign(payload, secret, options);

}