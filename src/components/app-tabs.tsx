
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.brand } }}
      tintColor={colors.brand}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: "house", selected: "house.fill" }}
          androidSrc={require("@/assets/images/tabIcons/home.png")}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Label>Explore</Label>
        <Icon
          sf={{ default: "safari", selected: "safari.fill" }}
          androidSrc={require("@/assets/images/tabIcons/explore.png")}
        />
      </NativeTabs.Trigger>

      {/* Create sits third of five — the centre slot, and the easiest reach for
          a thumb. Discovery (Home, Explore) is to its left, the user's own
          content (Tours, Profile) to its right. */}
      <NativeTabs.Trigger name="create">
        <Label>Create</Label>
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tours">
        <Label>Tours</Label>
        <Icon sf={{ default: "pano", selected: "pano.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        {/* `sf` takes SF Symbol names — the native tab bar renders these itself,
            so they are not part of the Feather migration. */}
        <Icon sf={{ default: "person", selected: "person.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
