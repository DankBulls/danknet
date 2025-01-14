@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()

    val gso = remember(context) {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(context.getString(R.string.google_client_id))
            .requestEmail()
            .build()
    }

    val googleSignInClient = remember(gso) {
        GoogleSignIn.getClient(context, gso)
    }

    LaunchedEffect(uiState) {
        if (uiState is LoginUiState.Success) {
            onLoginSuccess()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "DankNet",
            style = MaterialTheme.typography.headlineLarge,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        )

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        )

        Button(
            onClick = { viewModel.login(email, password) },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Text("Sign In")
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedButton(
            onClick = {
                val signInIntent = googleSignInClient.signInIntent
                // Launch Google Sign-In intent
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Text("Sign in with Google")
        }

        if (uiState is LoginUiState.Error) {
            Text(
                text = (uiState as LoginUiState.Error).message,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 16.dp)
            )
        }

        if (uiState is LoginUiState.Loading) {
            CircularProgressIndicator(
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
}
