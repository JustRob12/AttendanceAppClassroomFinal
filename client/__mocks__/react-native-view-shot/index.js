// Mock for react-native-view-shot
const React = require('react');

const ViewShot = ({ children, ...props }) => {
  return React.createElement('View', props, children);
};

module.exports = ViewShot;
module.exports.captureRef = jest.fn().mockResolvedValue('file:///mock/capture.jpg'); 