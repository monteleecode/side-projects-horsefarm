const passport = require("../middleware/passport");
const { userModel } = require("../models/userModel");

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

let authController = {
  login: (req, res) => {
    res.render("auth/login");
  },

  register: (req, res) => {
    res.render("auth/register");
  },

  loginSubmit: async (req, res, next) => {
    await passport.authenticate("local", { failureRedirect: '/auth/login', successRedirect: '/reminders'      
    })(req, res, next)
 },
  admin: (req, res) => {
    req.sessionStore.all((err, sessions)=> {
      if (err) {
        console.log(err)
      } else {
        res.render("auth/admin", {
          user: req.user,
          sessions
        })
      }
    })
  },
  revoke: (req, res) => {
    const revokeId = req.body.sessionId
    console.log(revokeId)
    req.sessionStore.destroy(revokeId, (err,any) => {})
    res.redirect('/admin')
  },
  // loginSubmit: (req, res) => {
  //   console.log("req",req);
  // },

// making register submit
registerSubmit: async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send('All fields (name, email, password) are required!');
  }

  try {
    const existingUser = await userModel.findOne(email);
    if (existingUser) {
      return res.status(400).send('Email is already registered!');
    } else {
      await db.user.create({
        data:{
      name,
      email,
      password,
          role: "user"
        },
      }) }
      res.redirect("/reminders")
  } catch (err) {
    console.error(err);
  }}
}

module.exports = authController;
