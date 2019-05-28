import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { ApolloProvider } from 'react-apollo-hooks';
import ApolloClient from 'apollo-boost';

export const apollo = new ApolloClient({
  uri: 'http://localhost:4466/graphql/endpoint',
  credentials: 'include',
});

ReactDOM.render(
  <ApolloProvider client={apollo}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
