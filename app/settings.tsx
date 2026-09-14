import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput, useTheme } from 'react-native-paper';

import { space } from '../src/palette.ts';
import { minimumWage2026 } from '../src/rules/law.ts';
import { ageOn } from '../src/rules/evaluate.ts';
import { useStore } from '../src/store.tsx';

const isoFrom = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

const dateLabel = (isoDate: string, fallback: string) =>
  isoDate === ''
    ? fallback
    : new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Defaults for a Washington school year, which the user can move if their district differs.
const defaultYearStart = () => `${new Date().getFullYear()}-09-01`;
const defaultYearEnd = () => `${new Date().getFullYear() + 1}-06-20`;

export default function Settings() {
  const { profile, saveProfile } = useStore();
  const router = useRouter();
  const theme = useTheme();

  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [wage, setWage] = useState(profile.hourlyWage > 0 ? profile.hourlyWage.toFixed(2) : '');
  const [weekdays, setWeekdays] = useState(profile.schoolWeekdays);
  const [yearStart, setYearStart] = useState(profile.schoolYearStart || defaultYearStart());
  const [yearEnd, setYearEnd] = useState(profile.schoolYearEnd || defaultYearEnd());

  const hourlyWage = Number.parseFloat(wage);
  const valid = birthDate !== '' && Number.isFinite(hourlyWage) && hourlyWage > 0;
  const age = birthDate === '' ? null : ageOn(birthDate, isoFrom(new Date()));
  const floor = age !== null && age < 16 ? minimumWage2026.under16 : minimumWage2026.adult;

  const pickDate = (current: string, apply: (iso: string) => void, earliest: Date, latest: Date) => {
    DateTimePickerAndroid.open({
      value: new Date(`${current || isoFrom(latest)}T12:00:00`),
      mode: 'date',
      minimumDate: earliest,
      maximumDate: latest,
      onValueChange: (_event, picked) => apply(isoFrom(picked)),
    });
  };

  const save = () => {
    saveProfile({
      birthDate,
      hourlyWage,
      schoolWeekdays: weekdays,
      schoolYearStart: yearStart,
      schoolYearEnd: yearEnd,
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text variant="bodyMedium" style={[styles.help, { color: theme.colors.onSurfaceVariant }]}>
        This stays on your phone. There is no account and nothing is uploaded.
      </Text>

      <Text variant="labelLarge" style={styles.label}>
        Your birthday
      </Text>
      <Button
        mode="outlined"
        icon="cake-variant-outline"
        onPress={() =>
          pickDate(birthDate, setBirthDate, new Date(1990, 0, 1), new Date())
        }
        style={styles.field}
      >
        {dateLabel(birthDate, 'Pick a date')}
      </Button>
      {age !== null && (
        <Text variant="bodySmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
          {age >= 18
            ? 'At 18 the minor hour limits no longer apply, so only wage and overtime rules are checked.'
            : `Washington sets your wage floor at $${floor.toFixed(2)} an hour in 2026.`}
        </Text>
      )}

      <TextInput
        label="What you are paid per hour"
        value={wage}
        onChangeText={setWage}
        keyboardType="decimal-pad"
        mode="outlined"
        left={<TextInput.Affix text="$" />}
        style={styles.field}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        School
      </Text>
      <Text variant="bodySmall" style={[styles.help, { color: theme.colors.onSurfaceVariant }]}>
        Hour limits are stricter during school weeks, so the app needs to know which weeks those
        are.
      </Text>

      <View style={styles.chips}>
        {weekdayNames.map((name, day) => (
          <Chip
            key={name}
            mode="outlined"
            selected={weekdays.includes(day)}
            onPress={() =>
              setWeekdays(
                weekdays.includes(day)
                  ? weekdays.filter((selected) => selected !== day)
                  : [...weekdays, day].sort(),
              )
            }
          >
            {name}
          </Chip>
        ))}
      </View>

      <View style={styles.times}>
        <Button
          mode="outlined"
          onPress={() => pickDate(yearStart, setYearStart, new Date(2020, 0, 1), new Date(2030, 0, 1))}
          style={styles.time}
        >
          {dateLabel(yearStart, 'First day')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => pickDate(yearEnd, setYearEnd, new Date(2020, 0, 1), new Date(2030, 0, 1))}
          style={styles.time}
        >
          {dateLabel(yearEnd, 'Last day')}
        </Button>
      </View>

      <Button mode="contained" onPress={save} disabled={!valid} style={styles.save}>
        Save
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: space.xl },
  help: { marginBottom: space.md },
  label: { marginBottom: space.sm },
  field: { marginBottom: space.md },
  note: { marginTop: -space.sm, marginBottom: space.md },
  sectionTitle: { marginTop: space.md, marginBottom: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  times: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  time: { flex: 1 },
  save: { paddingVertical: space.xs },
});
