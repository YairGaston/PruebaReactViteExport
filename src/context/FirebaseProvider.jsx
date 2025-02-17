

import PropTypes from 'prop-types';
import { FirebaseContext } from './FirebaseContext';
import { db, auth, provider } from './firebaseConfig';

export const FirebaseProvider = ({ children }) => {
  return (
    <FirebaseContext.Provider value={{ db, auth, provider }}>
      {children}
    </FirebaseContext.Provider>
  );
};

FirebaseProvider.propTypes = {
  children: PropTypes.node.isRequired,
};