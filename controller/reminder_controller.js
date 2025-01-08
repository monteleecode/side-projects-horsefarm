let {database} = require("../models/userModel");
let {db} = require("../models/userModel");

let remindersController = {
  list: async (req, res) => {
    const reminders = await db.reminder.findMany({
      where: { userId: req.user.id }
    })
    // let index_user = database.findIndex((user) => user.id === req.user.id)
    res.render("reminder/index", { reminders: reminders });
  },

  new: (req, res) => {
    res.render("reminder/create");
  },

  listOne: async (req, res) => {
    const reminders = await db.reminder.findMany({
      where: { userId: req.user.id }
    })
    let reminderToFind = Number(req.params.id);
    let searchResult = await db.reminder.findUnique({
      where: { 
        userId: req.user.id,
        id: reminderToFind
      }
    })
    if (searchResult != undefined) {
      res.render("reminder/single-reminder", { reminderItem: searchResult });
    } else {
      res.render("reminder/index", { reminders:reminders });
    }
  },

  // create: (req, res) => {
  //   let index_user = database.findIndex((user) => user.id === req.user.id)
  //   let reminder = {
  //     id: database[index_user].reminders.length + 1,
  //     title: req.body.title,
  //     description: req.body.description,
  //     completed: false,
  //   };
  //   database[index_user].reminders.push(reminder);
  //   res.redirect("/reminders");
  // },
  create: async (req, res) => {
    let user = req.user.id;
    await db.reminder.create({
      data:{
        title: req.body.title,
        description: req.body.description,
        completed: false,
        user: { connect: {id: user } }
      }
    })
    res.redirect("/reminders");
  },

  // edit reminder
  edit: async (req, res) => {
    let reminderToFind = Number(req.params.id);
    const reminderItem = await db.reminder.findUnique({
      where: {
        id: reminderToFind
      }
    })
    res.render("reminder/edit", { reminderItem: reminderItem})
  },

  // adding update
  update: async (req, res) => {
    let reminderToFind = Number(req.params.id);
    await db.reminder.update({
      where: {
        id: reminderToFind,
      },
      data: {
        title: req.body.title,
        description: req.body.description,
        completed: req.body.completed === "true"
      },
    })
    res.redirect("/reminders");
  },

  delete: async (req, res) => {
    // Implement this code
    let reminderToFind = Number(req.params.id);
    await db.reminder.delete({
      where: { 
        userId: req.user.id,
        id: reminderToFind
      }
    })
    res.redirect("/reminders");
  }
};

module.exports = remindersController;
