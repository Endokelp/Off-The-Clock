import * as ImagePicker from 'expo-image-picker';
import { recognizeText } from 'expo-mlkit-ocr';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Checkbox, Text, useTheme } from 'react-native-paper';

import { space } from '../src/palette.ts';
import {
  formatClock,
  formatDay,
  formatHours,
  todayIso,
  type Shift,
} from '../src/rules/evaluate.ts';
import { readSchedule, type ScannedLine, type ScannedShift } from '../src/schedule.ts';
import { useStore } from '../src/store.tsx';

type Stage =
  | { name: 'empty' }
  | { name: 'reading'; photo: string }
  | { name: 'read'; photo: string; found: ScannedShift[] };

const keyOf = (shift: ScannedShift) => `${shift.date} ${shift.startMinutes}`;

// The recognizer groups lines into blocks of its own choosing, which is not the same as the rows
// of the schedule. The parser regroups them by where they sit on the page, so all it needs is a
// flat list with each box.
const linesFrom = (blocks: Awaited<ReturnType<typeof recognizeText>>['blocks']): ScannedLine[] =>
  blocks.flatMap((block) =>
    block.lines.map((line) => ({
      text: line.text,
      left: line.boundingBox.x,
      top: line.boundingBox.y,
      height: line.boundingBox.height,
    })),
  );

export default function Scan() {
  const { shifts, addShifts } = useStore();
  const router = useRouter();
  const theme = useTheme();

  const [stage, setStage] = useState<Stage>({ name: 'empty' });
  const [skipped, setSkipped] = useState<string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);

  const read = async (photo: string) => {
    setStage({ name: 'reading', photo });
    setProblem(null);
    setSkipped([]);
    try {
      const { blocks } = await recognizeText(photo);
      setStage({ name: 'read', photo, found: readSchedule(linesFrom(blocks), todayIso()) });
    } catch {
      setProblem('That photo could not be read. A flatter, brighter shot usually works.');
      setStage({ name: 'empty' });
    }
  };

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setProblem('The camera is blocked for this app. Android settings can turn it back on.');
      return;
    }
    // No cropping step. Cropping a schedule is how people cut off the row they needed.
    const picked = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!picked.canceled) await read(picked.assets[0].uri);
  };

  const fromPhotos = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!picked.canceled) await read(picked.assets[0].uri);
  };

  const keep = stage.name === 'read' ? stage.found.filter((s) => !skipped.includes(keyOf(s))) : [];

  const add = () => {
    const stamp = Date.now();
    addShifts(
      keep.map(
        (shift, index): Shift => ({
          id: `${stamp}-${index}`,
          // The schedule rarely names the employer in a row, so the last one used carries over,
          // which is the same default the shift form uses.
          employer: shifts.at(-1)?.employer ?? '',
          date: shift.date,
          startMinutes: shift.startMinutes,
          endMinutes: shift.endMinutes,
          // A schedule shows hours, never the breaks that were actually given. Those are the
          // answers the money depends on, so they start empty and the user fills them in.
          mealBreakMinutes: 0,
          restBreaksTaken: 0,
          unpaidBreakMinutes: 0,
        }),
      ),
    );
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {stage.name !== 'empty' && (
        <Image source={{ uri: stage.photo }} style={styles.photo} resizeMode="contain" />
      )}

      {stage.name === 'empty' && (
        <View style={styles.block}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Photograph the schedule your manager posted and the app reads the days and hours off
            it. Nothing leaves the phone, the reading happens here.
          </Text>
          <Button
            mode="contained"
            icon="camera"
            onPress={fromCamera}
            contentStyle={styles.actionInside}
          >
            Take a photo
          </Button>
          <Button
            mode="outlined"
            icon="image-outline"
            onPress={fromPhotos}
            contentStyle={styles.actionInside}
          >
            Choose one you already took
          </Button>
        </View>
      )}

      {stage.name === 'reading' && (
        <View style={styles.block}>
          <ActivityIndicator />
          <Text variant="bodyMedium" style={styles.centered}>
            Reading the schedule
          </Text>
        </View>
      )}

      {stage.name === 'read' && stage.found.length === 0 && (
        <View style={styles.block}>
          <Text variant="titleMedium">Nothing on that photo looked like a shift</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            A row has to carry a day and a range of hours, the way Mon 9/14 4pm to 8pm does. Try a
            straighter photo, or add the shifts by hand.
          </Text>
          <Button mode="contained" onPress={fromCamera} contentStyle={styles.actionInside}>
            Try another photo
          </Button>
          <Button mode="text" onPress={() => router.back()}>
            Go back
          </Button>
        </View>
      )}

      {stage.name === 'read' && stage.found.length > 0 && (
        <View style={styles.block}>
          <Text variant="titleMedium">
            {stage.found.length} {stage.found.length === 1 ? 'shift' : 'shifts'} read off this
            schedule
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Uncheck anything you did not actually work. These are the hours the schedule shows, so
            open each one afterwards and say what breaks you really got. That gap is usually where
            the money is.
          </Text>

          {stage.found.map((shift) => {
            const kept = !skipped.includes(keyOf(shift));
            return (
              <Card
                key={keyOf(shift)}
                mode="outlined"
                onPress={() =>
                  setSkipped(
                    kept
                      ? [...skipped, keyOf(shift)]
                      : skipped.filter((key) => key !== keyOf(shift)),
                  )
                }
              >
                <Card.Content style={styles.row}>
                  <Checkbox status={kept ? 'checked' : 'unchecked'} />
                  <View style={styles.rowText}>
                    <Text variant="titleSmall">{formatDay(shift.date)}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatClock(shift.startMinutes)} to {formatClock(shift.endMinutes)},{' '}
                      {formatHours(shift.endMinutes - shift.startMinutes)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Read as: {shift.source}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })}

          <Button
            mode="contained"
            onPress={add}
            disabled={keep.length === 0}
            contentStyle={styles.actionInside}
          >
            {keep.length === 1 ? 'Add this shift' : `Add these ${keep.length} shifts`}
          </Button>
          <Button mode="text" onPress={fromCamera}>
            Read a different photo
          </Button>
        </View>
      )}

      {problem !== null && (
        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
          {problem}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: space.xl, gap: space.md },
  block: { gap: space.md },
  photo: { width: '100%', height: 220, borderRadius: space.sm },
  centered: { textAlign: 'center' },
  actionInside: { minHeight: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowText: { flex: 1, gap: space.xs },
});
