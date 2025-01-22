import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Image,
  Platform,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { DrawerContentScrollView } from "@react-navigation/drawer";

const Login = () => {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { signIn, setActive, isLoaded } = useSignIn();
  const {
    signUp,
    isLoaded: signUpLoaded,
    setActive: signupSetActive,
  } = useSignUp();
  const { user } = useUser();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const createuser = useMutation(api.users.createUser);

  const onSignInPress = async () => {
    console.log(isLoaded)
    console.log("---3---");
    if (!isLoaded) {
      return;
    }
    console.log("---22---");
    setLoading(true);
    console.log("---1---");
    try {
      const signedin = await signIn.create({
        identifier: emailAddress,
        password,
      });

      console.log("---signinINFO---");
      console.log(signedin);
      console.log("---signinUSERDATA---");
      console.log(signedin.userData);


      // This indicates the user is signed in
      await setActive({ session: signedin.createdSessionId });

      console.log(":?:,,,,")

      // Check if user is defined before accessing its properties
      await createuser({
        userId: signedin.identifier!,
        role: "user",
        createdAt: Date.now(),
        name: signedin.userData.firstName || "Anonymous",
        profileDetails: {
          email: signedin.userData.lastName,
        },
      });

      Alert.alert("Logged In");
    } catch (err: any) {
      console.log(":?:")
      console.log(err)
      Alert.alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };


  const onSignUpPress = async () => {
    if (!signUpLoaded) {
      return;
    }
    setLoading(true);

    try {
      // Create the user on Clerk
      const result = await signUp.create({
        emailAddress,
        password,
      });

      console.log("this is clerk signup info -->");
      console.log(result);

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })


      // This indicates the user is signed in
      signupSetActive({ session: result.createdSessionId });

      // Check if user is defined before accessing its properties
      await createuser({
        userId: result.id!,
        role: "user",
        createdAt: Date.now(),
        name: result.firstName || "Anonymous",
        profileDetails: {
          email: result.emailAddress!,
        },
      });

      Alert.alert("Signup successful and user created in the database!");
    } catch (err: any) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={70}
      style={styles.container}
    >
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <Image
        source={require("../assets/images/ring-103.gif")}
        style={styles.logo}
      />

      <Text style={styles.title}>
        {type === "login" ? "Welcome back" : "Create your account"}
      </Text>
      <View style={{ marginBottom: 30 }}>
        <TextInput
          autoCapitalize="none"
          placeholder="john@apple.com"
          value={emailAddress}
          onChangeText={setEmailAddress}
          style={styles.inputField}
        />
        <TextInput
          placeholder="password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.inputField}
        />
      </View>

      {type === "login" ? (
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onSignInPress}
        >
          <Text style={styles.btnPrimaryText}>Log In</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onSignUpPress}
        >
          <Text style={styles.btnPrimaryText}>Create account</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: "center",
    marginVertical: 80,
  },
  title: {
    fontSize: 30,
    marginBottom: 20,
    fontWeight: "bold",
    alignSelf: "center",
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "rgb(255, 77, 255 , 0.7)",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff",
  },
  btnPrimary: {
    backgroundColor: "rgb(255, 77, 255,0.3)",
    marginVertical: 4,
  },
  btnPrimaryText: {
    color: "#333333",
    fontSize: 16,
    marginBottom: 20,
    fontWeight: "bold",
    alignSelf: "center",
  },
  btn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 204, 255 ,0.5)",
  },
});

export default Login;
