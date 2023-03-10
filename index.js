const { ApolloServer } = require('apollo-server');
const { execute, subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { PubSub } = require('graphql-subscriptions');
 
const pubsub = new PubSub();
 
const User = [
  { Id: '1', Name: 'Thealoq', Discrim: '1042' },
  { Id: '2', Name: 'Ahmet', Discrim: '9910' },
  { Id: '3', Name: 'Mehmet', Discrim: '2215' },
];
 
const typeDefs = `#graphql
  type Subscription {
    Count: Int!
  }
 
  type User {
    Id: ID,
    Name: String,
    Discrim: String
  }
 
  type Query {
    Users: [User]
    User(Id: ID!): User
  }
 
  input CreateUserInput {
    Name: String!
  }
 
  input UpdateUserInput {
    Name: String!
    Discrim: String
  }
 
  type Mutation {
    createUser(data: CreateUserInput!): User!
    updateUser(Id: ID!, data: UpdateUserInput): User!
    deleteUser(Id: ID!): User
    deleteAllUser: User
  }
`;
 
const resolvers = {
  Query: {
    Users: () => User,
    User: (parent, { Id }) => {
      return User.find((user) => user.Id === Id);
    },
  },
  Mutation: {
    createUser: (parent, args) => {
      const newUser = {
        Id: String(User.length + 1),
        Name: args.data.Name,
        Discrim: Math.floor(Math.random() * (9999 - 1000 + 1) + 1000),
      };
      User.push(newUser);
      pubsub.publish('Count', {
        Count: User.length,
      });
      return newUser;
    },
 
    updateUser: (parent, { Id, data }) => {
      const FindUser = User.findIndex((user) => user.Id === Id);
      if (FindUser === -1) {
        throw new Error('User Not Found');
      } else {
        User[FindUser].Name = data.Name;
        User[FindUser].Discrim = data.Discrim;
      }
      return User[FindUser];
    },
 
    deleteUser: (parent, { Id }) => {
      const FindUser = User.findIndex((user) => user.Id === Id);
      if (FindUser === -1) {
        throw new Error('User Not Found');
      } else {
        const deletedUser = User.splice(FindUser, 1)[0];
        return deletedUser;
      }
    },
 
    deleteAllUser: (parent, args) => {
      User = [];
      return User.length;
    },
  },
  Subscription: {
    Count: {
      subscribe: () => {
        return pubsub.asyncIterator('Count');
      },
    },
  },
};
 
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
 
const server = new ApolloServer({
  schema,
});
 
const PORT = 4000;
 
server.listen(PORT).then(({ url }) => {
  console.log(`???? Server ready at ${url}`);
 
  new SubscriptionServer(
    {
      execute,
      subscribe,
      schema,
    },
    {
      server: server.httpServer,
      path: server.graphqlPath,
    }
  );
});
 