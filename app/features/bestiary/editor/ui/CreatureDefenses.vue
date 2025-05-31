<script setup lang="ts">
  import { SelectCondition, SelectDamageType } from '~ui/select';

  const vulnerabilities = defineModel<Array<string>>('vulnerabilities', {
    required: true,
  });

  const resistance = defineModel<Array<string>>('resistance', {
    required: true,
  });

  const immunityToDamage = defineModel<Array<string>>('immunityToDamage', {
    required: true,
  });

  const immunityToCondition = defineModel<Array<string>>(
    'immunityToCondition',
    { required: true },
  );
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="6">
      <AFormItem
        label="Уязвимость к урону"
        :name="['vulnerabilities']"
      >
        <SelectDamageType
          v-model="vulnerabilities"
          multiple
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Сопротивление к урону"
        :name="['resistance']"
      >
        <SelectDamageType
          v-model="resistance"
          multiple
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Иммунитет к урону"
        :name="['immunityToDamage']"
      >
        <SelectDamageType
          v-model="immunityToDamage"
          multiple
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Иммунитет к состояниям"
        :name="['immunityToCondition']"
      >
        <SelectCondition
          v-model="immunityToCondition"
          multiple
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
