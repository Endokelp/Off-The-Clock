import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Divider, FAB, List, Text, useTheme } from 'react-native-paper';

import { space } from '../src/palette.ts';
import { assess, formatDollars, formatHours, type Violation } from '../src/rules/evaluate.ts';
import { isProfileComplete, useStore } from '../src/store.tsx';

const dayLabel = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

export default function Home() {
  const { ready, shifts, profile } = useStore();
  const router = useRouter();
  const theme = useTheme();
  const [openViolation, setOpenViolation] = useState<string | null>(null);

  const result = useMemo(
    () => (isProfileComplete(profile) ? assess(shifts, profile) : null),
    [shifts, profile],
  );

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isProfileComplete(profile)) {
    return (
      <View style={styles.centered}>
        <Text variant="headlineSmall" style={styles.pitch}>
          Find out what your boss owes you.
        </Text>
        <Text variant="bodyMedium" style={[styles.support, { color: theme.colors.onSurfaceVariant }]}>
          Two questions first: how old you are and what you are paid. Washington sets different
          limits by age, so the answers change what counts as a violation.
        </Text>
        <Button mode="contained" onPress={() => router.push('/settings')} style={styles.cta}>
          Start
        </Button>
      </View>
    );
  }

  const owed = result?.owedCents ?? 0;
  const violations = result?.violations ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headline}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {shifts.length === 0 ? 'Nothing logged yet' : 'Your employer owes you'}
          </Text>
          <Text style={[styles.money, { color: theme.colors.primary }]}>{formatDollars(owed)}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {shifts.length === 0
              ? 'Add a shift you already worked and the number fills in.'
              : `${formatHours(result?.minutesWorked ?? 0)} logged across ${shifts.length} ` +
                `${shifts.length === 1 ? 'shift' : 'shifts'}.`}
          </Text>
        </View>

        {violations.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {violations.length} {violations.length === 1 ? 'problem' : 'problems'} found
            </Text>
            {violations.map((violation, index) => (
              <ViolationRow
                key={`${violation.code}-${violation.shiftId}-${index}`}
                violation={violation}
                expanded={openViolation === `${violation.code}-${index}`}
                onToggle={() =>
                  setOpenViolation(
                    openViolation === `${violation.code}-${index}` ? null : `${violation.code}-${index}`,
                  )
                }
              />
            ))}
          </View>
        )}

        {shifts.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Shifts
            </Text>
            {[...shifts]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((shift) => (
                <List.Item
                  key={shift.id}
                  title={shift.employer || 'Shift'}
                  description={`${dayLabel(shift.date)}, ${formatHours(
                    shift.endMinutes - shift.startMinutes - shift.mealBreakMinutes,
                  )}`}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push({ pathname: '/shift', params: { id: shift.id } })}
                  style={styles.row}
                />
              ))}
          </View>
        )}

        {shifts.length > 0 && (
          <List.Item
            title="Your record"
            description="Every shift and every rule broken, in one place"
            left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/export')}
            style={styles.row}
          />
        )}

        <Divider style={styles.divider} />
        <Button mode="text" onPress={() => router.push('/settings')} style={styles.settings}>
          About you
        </Button>
      </ScrollView>

      <FAB icon="plus" label="Add shift" onPress={() => router.push('/shift')} style={styles.fab} />
    </View>
  );
}

const ViolationRow = ({
  violation,
  expanded,
  onToggle,
}: {
  violation: Violation;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const theme = useTheme();
  return (
    <List.Accordion
      title={violation.headline}
      titleNumberOfLines={3}
      description={
        violation.owedCents > 0 ? `${formatDollars(violation.owedCents)} owed` : dayLabel(violation.date)
      }
      expanded={expanded}
      onPress={onToggle}
      style={styles.row}
    >
      <View style={styles.detail}>
        <Text variant="bodyMedium">{violation.detail}</Text>
        <Text variant="labelLarge" style={styles.citationSection}>
          {violation.citation.section}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {violation.citation.quote}
        </Text>
        <Button
          mode="text"
          compact
          onPress={() => Linking.openURL(violation.citation.url)}
          style={styles.readRule}
        >
          Read the rule
        </Button>
      </View>
    </List.Accordion>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: space.xl * 3 },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: space.lg },
  pitch: { marginBottom: space.md },
  support: { marginBottom: space.lg },
  cta: { alignSelf: 'flex-start' },
  headline: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  money: { fontSize: 64, lineHeight: 72, fontWeight: '700', marginVertical: space.sm },
  section: { marginBottom: space.lg },
  sectionTitle: { paddingHorizontal: space.lg, marginBottom: space.sm },
  row: { paddingHorizontal: space.sm, minHeight: 48 },
  detail: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm },
  citationSection: { marginTop: space.sm },
  readRule: { alignSelf: 'flex-start', marginLeft: -space.sm },
  divider: { marginHorizontal: space.lg },
  settings: { alignSelf: 'flex-start', marginLeft: space.md, marginTop: space.sm },
  fab: { position: 'absolute', right: space.md, bottom: space.lg },
});
