const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const userCheck = `SELECT * FROM user where username='${username}';`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbUser = await db.get(userCheck);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `INSERT INTO user(username,name,password,gender,location) 
      VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userCheck = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(userCheck);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassMatch = await bcrypt.compare(password, dbUser.password);
    if (isPassMatch) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userCheck = `SELECT * FROM user where username='${username}';`;
  const dbUser = await db.get(userCheck);
  const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);
  const hashPassword = await bcrypt.hash(newPassword, 10);
  if (comparePassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updateQuery = `UPDATE user SET password='${hashPassword}' WHERE username='${username}';`;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
