import GeneralStyles from "@/styles/GeneralStyles";
import React from "react";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Onboarding() {
  return (
    <SafeAreaView style={GeneralStyles.mainContainer}>
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require("../assets/images/screen_bg.png")}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          <Text style={GeneralStyles.heading}>GocerEase</Text>
          <Text style={GeneralStyles.subHeading}>
            Manage your grocery and pantry with ease, Know your budget
          </Text>
          {/* feature list */}
          <View
            style={{
              margin: "5%",
              paddingTop: "5%",
              justifyContent: "space-evenly",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                margin: "2%",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  borderRadius: 150,
                  backgroundColor: "white",
                  padding: "1%",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("../assets/images/grocery.png")}
                  style={{ width: 50, height: 50 }}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={{
                  fontSize: 16,
                  color: "white",
                  marginStart: "5%",
                  marginEnd: "5%",
                  width: "80%",
                }}
              >
                Create and manage shopping lists with ease.
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                margin: "2%",
                marginTop: "4%",
              }}
            >
              <View
                style={{
                  borderRadius: 150,
                  backgroundColor: "white",
                  padding: "1%",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("../assets/images/pantry.png")}
                  style={{ width: 50, height: 50 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: "white",
                  marginStart: "5%",
                  marginEnd: "5%",
                  width: "80%",
                }}
              >
                Keep track of what’s in your kitchen.
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                margin: "2%",
                marginTop: "4%",
              }}
            >
              <View
                style={{
                  borderRadius: 150,
                  backgroundColor: "white",
                  padding: "1%",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("../assets/images/cook_book.png")}
                  style={{ width: 50, height: 50 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: "white",
                  marginStart: "5%",
                  marginEnd: "5%",
                  width: "80%",
                }}
              >
                Discover recipes with your ingredients.
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                margin: "2%",
                marginTop: "4%",
              }}
            >
              <View
                style={{
                  borderRadius: 150,
                  backgroundColor: "white",
                  padding: "1%",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("../assets/images/budget.png")}
                  style={{ width: 50, height: 50 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: "white",
                  marginStart: "5%",
                  marginEnd: "5%",
                  width: "80%",
                }}
              >
                Track spending and stay on budget.
              </Text>
            </View>
          </View>
          {/* Bottom View */}
          <View
            style={{
              backgroundColor: "white",
              padding: "2%",
              marginTop: "5%",
              position: "absolute",
              width: "100%",
              height: "30%",
              bottom: 0,
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={{
                alignItems: "center",
                backgroundColor: "#2E674D",
                padding: "5%",
                borderRadius: 30,
                width: "70%",
                alignSelf: "center",
              }}
            >
              <Text style={{ fontSize: 16, color: "white" }}>Get Started</Text>
            </TouchableOpacity>

            <Text
              style={{
                textAlign: "center",
                marginTop: "5%",
                color: "#9DACA6",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              Already have an account?{" "}
              <Text
                style={{ color: "#2E674D", fontWeight: "600", fontSize: 14 }}
              >
                Login
              </Text>
            </Text>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}
