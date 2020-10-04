export default function ({ store, redirect, route }) {
  const auth = store.state.modules.auth.authenticated

  if (auth && route.name === 'login') {
    redirect('/')
  }
}
