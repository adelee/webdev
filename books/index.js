import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

// Set user authorization to edit, add, or delete a book
var userIsAuthorized = true;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Enter configuration details to connect to Postgres database
const db = new pg.Client({
    user: "user_name",
    host: "localhost",
    database: "database_name",
    password: "password",
    port: 5432,
});

db.connect();

// Sample data to insert into database
let books = [
    {
        id: 1,
        isbn: 9780671027032,
        date_read: new Date().toDateString(),
        title: "How to Win Friends and Influence People",
        author: "Dale Carnegie",
        description: "Great book on communicating and negotiating effectively!",
        rating: 10,
    },
    {
        id: 2,
        isbn: 9781984861207,
        date_read: new Date().toDateString(),
        title: "What Color Is Your Parachute?",
        author: "Richard N. Bolles",
        description: "Really good book if you're looking for a job or switching careers!",
        rating: 9,
    },
];

// db.query("INSERT INTO items (isbn, date_read, title, author, description, rating) VALUES ($1, $2, $3, $4, $5, $6)", [books[1].isbn, books[1].date_read, books[1].title, books[1].author, books[1].description, books[1].rating]);

// Home page with default sort by rating descending (items is the name of the postgres table with book info)
app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM items ORDER BY rating DESC");
        books = result.rows;
        // let covers = [];
        // for (let book of books) {
        //     const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`);
        //     covers.push(img);
        // }
        res.render("index.ejs", {books: books});
    } catch (err) {
        console.log(err);
    }
});

// Home page sorted by recency 
app.get("/sort", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM items ORDER BY date_read DESC");
        books = result.rows;
        res.render("index.ejs", {books: books});
    } catch (err) {
        console.log(err);
    }
});

// To edit a book
app.post("/edit", async (req, res) => {
    const id = req.body.editedItemId;
    const result = await db.query("SELECT * FROM items WHERE id=$1", [id]);
    res.render("update.ejs", {
        book: result.rows[0], 
        action: "Update",
    });
});

// To delete a book
app.post("/delete", async (req, res) => {
    try {
        if (userIsAuthorized) {
            const id = req.body.deletedItemId;
            await db.query("DELETE FROM items WHERE id=$1", [id]);
            res.redirect("/");
        } else {
            res.send("<h2>You are not authorized to perform this action.</h2>");
        }
    } catch (err) {
        console.log(err);
    }
});

// To add a book
app.post("/add", (req, res) => {
    res.render("update.ejs", {
        action: "Add",
    });
});

// Update page used for editing book information or adding a new book
app.post("/update", async (req, res) => {
    try {
        let existingBook = {};
        if (userIsAuthorized) {
            if (req.body.updatedItemId) {
                const id = req.body.updatedItemId;
                const result = await db.query("SELECT * FROM items where id=$1", [id]);
                existingBook = result.rows[0];
            }
            const updatedBook = {
                isbn: parseInt(req.body.isbn) || existingBook.isbn,
                date_read: req.body.date_read || existingBook.date_read || (new Date().toDateString()),
                title: req.body.title || existingBook.title,
                author: req.body.author || existingBook.author,
                description: req.body.description || existingBook.description,
                rating: req.body.rating || existingBook.rating,
            };
            if (req.body.updatedItemId) {
                await db.query("UPDATE items SET isbn=$1, date_read=$2, title=$3, author=$4, description=$5, rating=$6 WHERE id=$7", 
                    [updatedBook.isbn, updatedBook.date_read, updatedBook.title, updatedBook.author, updatedBook.description, updatedBook.rating, existingBook.id]);
            } else {
                await db.query("INSERT INTO items (isbn, date_read, title, author, description, rating) VALUES ($1, $2, $3, $4, $5, $6)", 
                    [updatedBook.isbn, updatedBook.date_read, updatedBook.title, updatedBook.author, updatedBook.description, updatedBook.rating]);
            }
            res.redirect("/");
        } else {
            res.send("<h2>You are not authorized to perform this action.</h2>");
        }
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});
