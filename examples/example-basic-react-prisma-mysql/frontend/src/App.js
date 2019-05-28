import React from 'react';
import logo from './logo.svg';
import './App.css';

import gql from 'graphql-tag';
import { useQuery } from 'react-apollo-hooks';

const GET_POSTS = gql`
  query GET_POSTS {
    posts {
      id
      title
      content
      author {
        id
        name
      }
    }
  }
`;

function App() {
  const { data, error, loading } = useQuery(GET_POSTS);
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error! {error.message}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <ul>
          {data.posts.map(post => (
            <li key={post.id}>
              <p>
                <strong>Title</strong>: {post.title}
              </p>
              <p>
                <strong>Content</strong>: {post.content}
              </p>
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
