const express = require("express");
const cors = require("cors");
const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
}));

// Routes
app.use("/auth", require("./routes/auth.routes"));
app.use("/customers", require("./routes/customers.routes"));
app.use("/accounts", require("./routes/accounts.routes"));
app.use("/transactions", require("./routes/transactions.routes"));
app.use("/audit", require("./routes/audit.routes"));

module.exports = app;
