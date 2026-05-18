declare module '../webgl/App.jsx';
declare module '*.jsx' {
  const component: import('react').ComponentType<unknown>;
  export default component;
}

