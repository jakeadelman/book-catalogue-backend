const { Book, User } = require('../models');
const { signToken, authMiddleware } = require('../utils/auth');



const resolvers = {
    Query: {
        getSingleUser: async (parent, body, res) => {
            const user = authMiddleware(body.token)
            let user1 = User.findOne({ _id: user.data._id })
                .populate("Book")
            let user2 = await user1
            console.log(user2.savedBooks)
            return user2
        }



        // schools: async () => {
        //     return await School.find({}).populate('classes').populate({
        //         path: 'classes',
        //         populate: 'professor',
        //     });
        // },
        // classes: async () => {
        //     return await Class.find({}).populate('professor');
        // },
        // // Define a resolver to retrieve individual classes
        // class: async (parent, args) => {
        //     // Use the parameter to find the matching class in the collection
        //     return await Class.findById(args.id).populate('professor');
        // },
        // professors: async () => {
        //     return await Professor.find({}).populate('classes');
        // },
    },
    Mutation: {
        createUser: async (parent, { username, email, password }) => {
            // First we create the user
            const user = await User.create({ username, email, password });
            // To reduce friction for the user, we immediately sign a JSON Web Token and log the user in after they are created
            const token = signToken(user);
            // Return an `Auth` object that consists of the signed token and user's information
            return { token, user };
        },
        login: async (parent, { email, password }) => {
            // Look up the user by the provided email address. Since the `email` field is unique, we know that only one person will exist with that email
            const user = await User.findOne({ email });

            // If there is no user with that email address, return an Authentication error stating so
            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            }

            // If there is a user found, execute the `isCorrectPassword` instance method and check if the correct password was provided
            const correctPw = await user.isCorrectPassword(password);

            // If the password is incorrect, return an Authentication error stating so
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            // If email and password are correct, sign user into the application with a JWT
            const token = signToken(user);

            // Return an `Auth` object that consists of the signed token and user's information
            console.log(token)
            const obj = { token: token, user: user }
            console.log(obj)
            return { token, user }
        },
        saveBook: async (parent, body, res) => {
            const user = authMiddleware(body.token)
            const book = {
                description: body.description,
                bookId: body.bookId,
                title: body.title,
                link: body.link,
                authors: body.authors,
                image: body.images

            }
            console.log(book)
            try {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user.data._id },
                    { $addToSet: { savedBooks: book } },
                    { new: true, runValidators: true }
                );
                console.log(updatedUser, "THIS UPDATED")
                return updatedUser
            } catch (err) {
                console.log(err);
                return err;
            }
        },
        deleteBook: async (parent, body, res) => {
            const user = authMiddleware(body.token)

            const updatedUser = await User.findOneAndUpdate(
                { _id: user.data._id },
                { $pull: { savedBooks: { bookId: body.bookId } } },
                { new: true }
            );
            if (!updatedUser) {
                return ({ message: "Couldn't find user with this id!" });
            }
            return updatedUser
        },
    }
};

module.exports = resolvers;
