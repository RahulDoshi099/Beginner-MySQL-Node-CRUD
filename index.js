import express from "express";
import mysql from "mysql";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Password123#",
  database: "test",
});

app.use(express.json());
app.use(cors());

// connect to MySQL server
db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL server");
});

app.listen(8800, () => {
  console.log("coonected to backend-8800");
});

app.get("/", (req, res) => {
  res.json("Hello this is backend");
});

//verify-token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  const tokenData = token.split(" ")
  if (!token) {
    return res.status(401).json("Access denied. No token provided.");
  }
  try {
    const decoded = jwt.verify(tokenData[1], "your-secret-key-here");
    req.body.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(400).json("Invalid token.");
  }
};

// Get All Books
app.get("/books", (req, res) => {
  const q = "SELECT * FROM books";

  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

// Add Book
app.post("/books", (req, res) => {
  const values = [req.body.title, req.body.desc, req.body.cover];
  const q = "INSERT INTO books(`title`,`desc`,`cover`) VALUES (?)";
  db.query(q, [values], (err, data) => {
    if (err) return res.json(err);
    return res.json("Book is added successfully !!");
  });
});

//Delete single book
app.delete("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const q = "DELETE FROM books WHERE id = ?";

  db.query(q, [bookId], (err, data) => {
    if (err) return res.json(err);
    return res.json("Book is deleted successfully !!");
  });
});

//Update single book data
app.put("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const q =
    "UPDATE books SET `title` = ?, `desc` = ? , `cover` = ? WHERE id = ?";

  const values = [req.body.title, req.body.desc, req.body.cover];

  db.query(q, [...values, bookId], (err, data) => {
    if (err) return res.json(err);
    return res.json("Book is Updated successfully !!");
  });
});

//Register User
app.post("/register", async (req, res) => {
  const { firstName, lastName, username, password, birthday, email, city } =
    req.body;

  const errors = [];

  // Check that birthday is in the correct format (YYYY-MM-DD)
  const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!birthdayRegex.test(birthday)) {
    errors.push(
      "Invalid birthday format ! Please pass birthdate in YYYY-MM-DD"
    );
  }

  // Check that birthday is not in the future
  const currentDate = new Date();
  const inputDate = new Date(birthday);
  if (inputDate > currentDate) {
    errors.push("Invalid birthday");
  }

  // Check for valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  // Check if there are any errors
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  const newbirthday = new Date(birthday);

  const values = [
    firstName,
    lastName,
    username,
    hashedPassword,
    newbirthday,
    email,
    city,
  ];

  const query =
    "INSERT INTO userDetails(`firstName`,`lastName`,`username`,`password`,`birthday`,`email`,`city`) VALUES (?,?,?,?,?,?,?)";

  db.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json("Error registering new user");
    } else {
      res.status(200).json("User registered successfully");
    }
  });
});

//Get all User
app.get("/users", verifyToken, (req, res) => {
  const query = "SELECT * FROM userDetails";

  db.query(query, (err, data) => {
    if (err) return res.json(err);
    res.json(data);
  });
});

// //Log-In User without token 
// app.post("/login", (req, res) => {
//   const { username, password } = req.body;
//   // const query = "SELECT * FROM userDetails WHERE username = ? ";
//   const query = "SELECT * FROM userDetails WHERE BINARY username = ?";

//   db.query(query, [username], (err, data, fields) => {
//     if (err) {
//       console.log("🚀 ~ file: index.js:156 ~ db.query ~ err:", err)
//       res.status(500).json("server error");
//     } else {
//       if (data.length > 0) {
//         const user = data[0];
//         if (bcrypt.compareSync(password, user.password)) {
//           res.status(200).json("Login Successful");
//         } else {
//           res.status(401).json("Incorrect password");
//         }
//       } else {
//         res.status(404).json("User not found !!!");
//       }
//     }
//   });
// });

//Log-In User
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM userDetails WHERE BINARY username = ?";

  db.query(query, [username], (err, data, fields) => {
    if (err) {
      res.status(500).json("server error");
    } else {
      if (data.length > 0) {
        const user = data[0];
        if (bcrypt.compareSync(password, user.password)) {
          const token = jwt.sign({ userId: user.id }, "your-secret-key-here");
          res.json({ token : token , message: "You have LogIn successfully!" });
        } else {
          res.status(401).json("Incorrect password");
        }
      } else {
        res.status(404).json("User not found !!!");
      }
    }
  });
});

// app.get("/protected-route", verifyToken, (req, res) => {
//   // Your protected route handler here
// });
