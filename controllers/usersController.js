const User = require("../models/User");
const Note = require("../models/Note");

const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

/* 
    desc Get all users
    route GET /users
    access Private
*/
const getAllUser = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password").lean();
    if (!users?.length) {
        return res.status(400).json({
            message: "No users found",
        });
    }
    res.json(users);
});

/* 
    desc create new user
    route POST /users
    access Private
*/
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;

    //confirm data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({
            message: "All fields are required",
        });
    }

    //check for dups
    const duplicate = await User.findOne({ username }).lean().exec();

    if (duplicate) {
        return res.status(409).json({
            message: "Duplicate username",
        });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const userObj = { username, password: hashedPwd, roles };

    //create new use
    const user = await User.create(userObj);

    if (user) {
        res.status(201).json({
            message: `New user ${username} created`,
        });
    } else {
        res.status(400).json({
            message: "Invalid user data recieved",
        });
    }
});

/* 
    desc Update a user
    route PATCH /users
    access Private
*/
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, password, roles, active } = req.body;

    //confirm data
    if (
        !id ||
        !username ||
        !Array.isArray(roles) ||
        !roles.length ||
        typeof active !== "boolean"
    ) {
        return res.status(400).json({
            message: "All fields are required",
        });
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({
            message: "User not found",
        });
    }

    //check for dups
    const duplicate = await User.findOne({ username }).lean().exec();

    //allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({
            message: "Duplicate username",
        });
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    if (updatedUser) {
        res.json({
            message: "User updated",
        });
    }
});

/* 
    desc Delete a user
    route DELETE /users
    access Private
*/
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({
            message: "User ID required",
        });
    }

    const notes = await Note.find({ user: id }).lean().exec();
    if (notes?.length) {
        return res.status(400).json({
            message: "User has notes. Delete notes first",
        });
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({
            message: "User not found",
        });
    }

    const result = await user.deleteOne();

    const reply = `User ${user.username} with ID ${result.id} deleted`;

    res.json({
        message: reply,
    });
 });

module.exports = {
    getAllUser,
    createNewUser,
    updateUser,
    deleteUser,
};
