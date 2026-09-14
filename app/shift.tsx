import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

import { space } from '../src/palette.ts';
import { formatHours, minutesWorkedIn, type Shift } from '../src/rules/evaluate.ts';
import { useStore } from '../src/store.tsx';

const todayIso = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};

const clockLabel = (minutes: number) => {
  const wrapped = minutes % 1440;
  const hour = Math.floor(wrapped / 60);
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(wrapped % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

const dateLabel = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

// A number the user typed, which may be empty or nonsense, becomes a count of minutes here.
const minutesFrom = (typed: string) => {
  const parsed = Number.parseInt(typed, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export default function ShiftForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { shifts, saveShift, removeShift } = useStore();
  const router = useRouter();
  const theme = useTheme();

  const existing = shifts.find((shift) => shift.id === id);
  const lastEmployer = shifts.at(-1)?.employer ?? '';

  const [employer, setEmployer] = useState(existing?.employer ?? lastEmployer);
  const [date, setDate] = useState(existing?.date ?? todayIso());
  const [startMinutes, setStartMinutes] = useState(existing?.startMinutes ?? 16 * 60);
  const [endMinutes, setEndMinutes] = useState(existing?.endMinutes ?? 20 * 60);
  const [mealBreak, setMealBreak] = useState(String(existing?.mealBreakMinutes ?? 0));
  const [deducted, setDeducted] = useState(String(existing?.unpaidBreakMinutes ?? 0));
  const [restBreaks, setRestBreaks] = useState(String(existing?.restBreaksTaken ?? 0));

  const draft: Shift = {
    id: existing?.id ?? `${Date.now()}`,
    employer: employer.trim(),
    date,
    startMinutes,
    endMinutes,
    mealBreakMinutes: minutesFrom(mealBreak),
    restBreaksTaken: minutesFrom(restBreaks),
    unpaidBreakMinutes: minutesFrom(deducted),
  };

  const worked = minutesWorkedIn(draft);
  const crossesMidnight = endMinutes > 1440;

  const pickDate = () => {
    DateTimePickerAndroid.open({
      value: new Date(`${date}T12:00:00`),
      mode: 'date',
      maximumDate: new Date(),
      onValueChange: (_event, picked) =>
        setDate(
          [
            picked.getFullYear(),
            String(picked.getMonth() + 1).padStart(2, '0'),
            String(picked.getDate()).padStart(2, '0'),
          ].join('-'),
        ),
    });
  };

  const pickTime = (current: number, apply: (minutes: number) => void) => {
    const seed = new Date();
    seed.setHours(Math.floor((current % 1440) / 60), current % 60, 0, 0);
    DateTimePickerAndroid.open({
      value: seed,
      mode: 'time',
      onValueChange: (_event, picked) => apply(picked.getHours() * 60 + picked.getMinutes()),
    });
  };

  const setEnd = (minutes: number) => {
    // A shift that ends at or before it started ran past midnight, so it belongs to the next day.
    setEndMinutes(minutes <= startMinutes ? minutes + 1440 : minutes);
  };

  const save = () => {
    saveShift(draft);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <TextInput
        label="Where you worked"
        value={employer}
        onChangeText={setEmployer}
        mode="outlined"
        style={styles.field}
      />

      <Button mode="outlined" icon="calendar" onPress={pickDate} style={styles.field}>
        {dateLabel(date)}
      </Button>

      <View style={styles.times}>
        <Button
          mode="outlined"
          icon="clock-outline"
          onPress={() => pickTime(startMinutes, setStartMinutes)}
          style={styles.time}
        >
          {clockLabel(startMinutes)}
        </Button>
        <Button
          mode="outlined"
          icon="clock-outline"
          onPress={() => pickTime(endMinutes, setEnd)}
          style={styles.time}
        >
          {clockLabel(endMinutes)}
        </Button>
      </View>
      <HelperText type="info" visible>
        {crossesMidnight
          ? `Ends after midnight, ${formatHours(worked)} worked.`
          : `${formatHours(worked)} worked.`}
      </HelperText>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Breaks
      </Text>
      <Text variant="bodySmall" style={[styles.help, { color: theme.colors.onSurfaceVariant }]}>
        Answer for what actually happened, not what the schedule said. The gap between the two is
        usually where the money is.
      </Text>

      <TextInput
        label="Meal break you actually got, in minutes"
        value={mealBreak}
        onChangeText={setMealBreak}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.field}
      />

      <Text variant="labelLarge" style={styles.label}>
        Ten minute rest breaks you got
      </Text>
      <SegmentedButtons
        value={restBreaks}
        onValueChange={setRestBreaks}
        buttons={['0', '1', '2', '3'].map((count) => ({ value: count, label: count }))}
        style={styles.field}
      />

      <TextInput
        label="Break time taken off your pay, in minutes"
        value={deducted}
        onChangeText={setDeducted}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.field}
      />

      <Button mode="contained" onPress={save} style={styles.save} disabled={worked <= 0}>
        {existing ? 'Save changes' : 'Add this shift'}
      </Button>

      {existing && (
        <Button
          mode="text"
          textColor={theme.colors.error}
          onPress={() => {
            removeShift(existing.id);
            router.back();
          }}
        >
          Delete this shift
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: space.xl },
  field: { marginBottom: space.md },
  times: { flexDirection: 'row', gap: space.sm },
  time: { flex: 1 },
  sectionTitle: { marginTop: space.md, marginBottom: space.xs },
  help: { marginBottom: space.md },
  label: { marginBottom: space.sm },
  save: { marginTop: space.sm, paddingVertical: space.xs },
});
