// const { PrismaClient } = require("@prisma/client");
// const db = new PrismaClient();

const db = require('./db');

const userModel = {

  findOne: async (email) => {
    const user = await db.user.findUnique({
      where: { email }
    });
    console.log("ENTERED FIND ONE")
    console.log(user);
    if (user) {
      return user;
    }
    console.log(`Couldn't find user with email: ${email}`);
    return null;
  },
  findById: async (id) => {
    const user = await db.user.findMany({
      where: { id: id  },
    });;
    if (user) {
      return user;
    }
    throw new Error(`Couldn't find user with id: ${id}`);
  },
  // user email checker
  // findEmail: (email) => {
  //   const user = database.find((user) => user.email === email);
  //   if (user) {
  //     return user;
  //   } else {
  //     return null;
  //   }
  // },
};

module.exports = { userModel };
