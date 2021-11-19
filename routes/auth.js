const router = require("express").Router();
const User = require("../models/user");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

//REGISTER
router.post("/register", async(req, res) => {
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(
            req.body.password,
            process.env.PASS_SEC
        ).toString()
    });

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(500).json(err);
    }
});

//LOGIN
router.post("/login", async(req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        //If User Doesn't Match (exists)
        !user && res.status(401).json("Wrong Crendentials!");

        //Dycrypt the matched User Password
        const hashedPassword = CryptoJS.AES.decrypt(
            user.password,
            process.env.PASS_SEC
        );
        const OriginalPassword = hashedPassword.toString(
            CryptoJS.enc.Utf8
        );

        //Compare the password entery with the matched User Password
        OriginalPassword !== req.body.password &&
            res.status(401).json("Wrong Crendentials!");

        const accessToken = jwt.sign({
                id: user._id,
                isAdmin: user.isAdmin,

            },
            process.env.JWT_SEC, { expiresIn: "3d" }
        );


        //Send all the info but Password to User
        //MongoDB store our users in a document under _doc
        const { password, ...others } = user._doc;
        //Return the user infos-{password} if the login is Successfull
        res.status(200).json({...others, accessToken });
        // res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router;