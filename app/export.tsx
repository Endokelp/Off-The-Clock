import { useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, Text, useTheme } from 'react-native-paper';

import { space } from '../src/palette.ts';
import { usePurchase } from '../src/purchases.tsx';
import { assess, formatDollars, formatHours, type Assessment, type Shift } from '../src/rules/evaluate.ts';
import { isProfileComplete, useStore } from '../src/store.tsx';

const dayLabel = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

// A shift that runs past midnight has an end time past 1440, which still belongs on the clock of
// the day it started.
const clock = (minutes: number) => {
  const onClock = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(onClock / 60);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(onClock % 60).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
};

export default function Export() {
  const { shifts, profile } = useStore();
  const { ready, configured, unlocked, price, parentLink, buy, refresh } = usePurchase();
  const theme = useTheme();
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const result = useMemo(
    () => (isProfileComplete(profile) ? assess(shifts, profile) : null),
    [shifts, profile],
  );

  const ordered = useMemo(() => [...shifts].sort((a, b) => a.date.localeCompare(b.date)), [shifts]);
  const covers =
    ordered.length === 0
      ? 'Nothing logged yet'
      : `${dayLabel(ordered[0].date)} to ${dayLabel(ordered[ordered.length - 1].date)}`;

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  const run = async (action: () => Promise<string | null>) => {
    setWorking(true);
    setProblem(await action());
    setWorking(false);
  };

  const share = async () => {
    if (parentLink === null) return;
    await Share.share({
      message:
        `I have been logging my shifts and the app found ${formatDollars(result?.owedCents ?? 0)} ` +
        `my work owes me. This opens the full record: ${parentLink}`,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {covers}
      </Text>
      <Text variant="headlineSmall" style={styles.title}>
        {formatDollars(result?.owedCents ?? 0)} across {shifts.length}{' '}
        {shifts.length === 1 ? 'shift' : 'shifts'}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {formatHours(result?.minutesWorked ?? 0)} worked. {result?.violations.length ?? 0}{' '}
        {result?.violations.length === 1 ? 'rule broken' : 'rules broken'}.
      </Text>

      <Divider style={styles.divider} />

      {unlocked ? (
        <Record ordered={ordered} result={result} />
      ) : (
        <Locked
          configured={configured}
          price={price}
          parentLink={parentLink}
          working={working}
          problem={problem}
          onShare={share}
          onBuy={() => run(buy)}
          onRefresh={() => run(refresh)}
        />
      )}
    </ScrollView>
  );
}

const Locked = ({
  configured,
  price,
  parentLink,
  working,
  problem,
  onShare,
  onBuy,
  onRefresh,
}: {
  configured: boolean;
  price: string | null;
  parentLink: string | null;
  working: boolean;
  problem: string | null;
  onShare: () => void;
  onBuy: () => void;
  onRefresh: () => void;
}) => {
  const theme = useTheme();

  if (!configured) {
    return (
      <View style={styles.block}>
        <Text variant="titleMedium">The record is switched off in this build</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Logging shifts and finding what you are owed never depended on it and still works. The
          readme describes the keys this screen needs.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Text variant="titleMedium">The full record is locked</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        It lists every shift with the hours you worked, every rule your employer broke, and the
        statute behind each one. It is the version you show a parent or a manager.
      </Text>

      {parentLink !== null && (
        <>
          <Button
            mode="contained"
            icon="share-variant"
            onPress={onShare}
            disabled={working}
            contentStyle={styles.actionInside}
          >
            Send a parent the link
          </Button>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            They pay on their own phone. Nothing is charged to you, and the record opens here.
          </Text>
          <Button mode="text" onPress={onRefresh} disabled={working} style={styles.quiet}>
            A parent already paid
          </Button>
        </>
      )}

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        onPress={onBuy}
        loading={working}
        disabled={working}
        contentStyle={styles.actionInside}
      >
        {price === null ? 'Unlock it yourself' : `Unlock it yourself for ${price}`}
      </Button>

      {problem !== null && (
        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
          {problem}
        </Text>
      )}
    </View>
  );
};

const Record = ({ ordered, result }: { ordered: Shift[]; result: Assessment | null }) => {
  const theme = useTheme();
  return (
    <View style={styles.block}>
      {ordered.map((shift) => {
        const against =
          result?.violations.filter((violation) => violation.shiftId === shift.id) ?? [];
        return (
          <Card key={shift.id} mode="outlined" style={styles.card}>
            <Card.Content style={styles.cardInside}>
              <Text variant="titleSmall">{shift.employer || 'Shift'}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {dayLabel(shift.date)}, {clock(shift.startMinutes)} to {clock(shift.endMinutes)},{' '}
                {formatHours(shift.endMinutes - shift.startMinutes - shift.mealBreakMinutes)} worked
              </Text>
              {against.map((violation, index) => (
                <View key={`${violation.code}-${index}`} style={styles.finding}>
                  <Text variant="bodyMedium">{violation.headline}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {violation.citation.section}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: space.lg, paddingBottom: space.xl },
  centered: { flex: 1, justifyContent: 'center' },
  title: { marginVertical: space.xs },
  divider: { marginVertical: space.lg },
  block: { gap: space.md },
  actionInside: { minHeight: 48 },
  quiet: { alignSelf: 'flex-start', marginLeft: -space.sm },
  card: { marginTop: space.xs },
  cardInside: { gap: space.xs },
  finding: { marginTop: space.sm, gap: space.xs },
});
